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
    const urlNew = $("section#news .news_area li a").first().attr("href");

    if (!urlNew) {
      throw new Error("URL berita tidak ditemukan");
    }

    // 3. Buat URL lengkap
    const fullUrl = urlNew.startsWith("http") ? urlNew : `https://id.toram.jp${urlNew}`;

    // 4. Fetch halaman detail berita
    const bannerResponse = await fetch(fullUrl);
    const bannerHtml = await bannerResponse.text();
    const $banner = cheerio.load(bannerHtml);

    // 5. Ambil judul dan tanggal
    const title = $banner(".news_title").text().trim();
    const date = $banner(".news_date time").text().trim();

    // 6. Ambil semua gambar banner dari halaman detail
    const bannerImages = [];
    $banner("center img").each((i, elem) => {
      const imgSrc = $banner(elem).attr("src");
      if (imgSrc && (imgSrc.includes("toram_orbitem") || imgSrc.includes("toram_avatar"))) {
        const fullImgUrl = imgSrc.startsWith("http") ? imgSrc : `https://id.toram.jp${imgSrc}`;
        bannerImages.push(fullImgUrl);
      }
    });

    // 7. Ambil daftar kampanye dari link di top
    const campaignLinks = [];
    $banner("#top").next("br").nextAll("a").each((i, elem) => {
      const linkText = $banner(elem).text().trim();
      if (linkText && !linkText.includes("Back to Top")) {
        campaignLinks.push(linkText);
      }
    });

    // 8. Format pesan ringkas
    let message = `*${title}*\n${date}\n\n`;
    message += `Kampanye Aktif:\n\n`;

    campaignLinks.forEach((campaign, index) => {
      message += `${index + 1}. ${campaign}\n`;
    });

    message += `\nLink: ${fullUrl}`;

    // 9. Kirim pesan text dulu
    await sock.sendMessage(
      chatId,
      { text: message },
      { quoted: msg }
    );

    // 10. Kirim gambar-gambar banner dari halaman detail
    for (let i = 0; i < bannerImages.length; i++) {
      await sock.sendMessage(
        chatId,
        {
          image: { url: bannerImages[i] },
          caption: `Banner ${i + 1}`
        },
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
