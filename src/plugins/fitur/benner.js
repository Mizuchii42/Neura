import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const Benner = async (sock, chatId, msg, text) => {
  try {
    const targetUrl = "https://id.toram.jp/?type_code=all#contentArea";

    // 1. Fetch halaman utama
    const response = await fetch(targetUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 2. Ambil URL berita terbaru
    const urlNew = $(".news_area > .common_list > .news_border").first().attr("href");

    if (!urlNew) {
      throw new Error("URL berita tidak ditemukan");
    }

    // 3. Buat URL lengkap
    const fullUrl = urlNew.startsWith("http") ? urlNew : `https://id.toram.jp${urlNew}`;

    // 4. Fetch halaman detail berita
    const bannerResponse = await fetch(fullUrl);
    const bannerHtml = await bannerResponse.text();
    const $banner = cheerio.load(bannerHtml);

    // 5. Ambil informasi banner kampanye
    const campaigns = [];

    // Ambil semua gambar banner dari halaman
    $banner("center img").each((i, elem) => {
      const imgSrc = $banner(elem).attr("src");
      if (imgSrc && (imgSrc.includes("toram_orbitem") || imgSrc.includes("toram_avatar"))) {
        campaigns.push({
          image: imgSrc.startsWith("http") ? imgSrc : `https://id.toram.jp${imgSrc}`,
          index: i
        });
      }
    });

    // 6. Ambil judul dan detail kampanye
    const title = $banner(".news_title").text().trim();
    const date = $banner(".news_date time").text().trim();

    // 7. Ambil semua section kampanye
    const campaignDetails = [];
    $banner("h2.deluxetitle").each((i, elem) => {
      const sectionTitle = $banner(elem).text().trim();
      const sectionId = $banner(elem).attr("id");

      // Cari gambar di section ini
      let sectionImage = null;
      $banner(elem).nextAll("center").first().find("img").each((j, img) => {
        const src = $banner(img).attr("src");
        if (src) {
          sectionImage = src.startsWith("http") ? src : `https://id.toram.jp${src}`;
        }
      });

      campaignDetails.push({
        id: sectionId,
        title: sectionTitle,
        image: sectionImage
      });
    });

    // 8. Format pesan
    let message = `*${title}*\n`;
    message += `${date}\n\n`;
    message += `Link: ${fullUrl}\n\n`;
    message += `Daftar Kampanye:\n\n`;

    campaignDetails.forEach((campaign, index) => {
      message += `${index + 1}. ${campaign.title}\n`;
    });

    // 9. Kirim pesan dengan gambar pertama (jika ada)
    if (campaigns.length > 0) {
      await sock.sendMessage(
        chatId,
        {
          image: { url: campaigns[0].image },
          caption: message
        },
        { quoted: msg }
      );

      // Kirim gambar banner lainnya (max 5 untuk menghindari spam)
      for (let i = 1; i < Math.min(campaigns.length, 5); i++) {
        await sock.sendMessage(
          chatId,
          {
            image: { url: campaigns[i].image },
            caption: `Banner ${i + 1}: ${campaignDetails[i]?.title || 'Campaign'}`
          },
          { quoted: msg }
        );
      }
    } else {
      // Jika tidak ada gambar, kirim text saja
      await sock.sendMessage(
        chatId,
        { text: message },
        { quoted: msg }
      );
    }

  } catch (err) {
    console.error("[Benner Error]", err);
    await sock.sendMessage(
      chatId,
      {
        text: `Terjadi kesalahan saat mengambil banner.\n\nDetail Error:\n${err.message}`
      },
      { quoted: msg }
    );
  }
};
