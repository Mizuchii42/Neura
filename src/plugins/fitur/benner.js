import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const Banner = async (sock, msg, chatId) => {
  try {
    const baseUrl = "https://id.toram.jp";
    const listUrl = "https://id.toram.jp/?type_code=all#contentArea";

    // 1. ambil halaman list news
    const response = await fetch(listUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 2. cari link news pertama
    let newsLink = null;
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("news")) {
        newsLink = href;
        return false; // break
      }
    });

    if (!newsLink) throw new Error("No news link found");

    if (!newsLink.startsWith("http")) {
      newsLink = baseUrl + newsLink;
    }

    // 3. ambil halaman detail news
    const bannerResponse = await fetch(newsLink);
    const bannerHtml = await bannerResponse.text();
    const $banner = cheerio.load(bannerHtml);

    // 4. ambil judul & tanggal
    const title = $banner(".news_title").text().trim();
    const date = $banner(".news_date time").text().trim();

    // 5. ambil gambar banner
    const bannerImages = [];
    $banner("img").each((i, img) => {
      const src = $banner(img).attr("src");
      if (
        src &&
        (src.includes("toram_orbitem") || src.includes("toram_avatar"))
      ) {
        bannerImages.push(
          src.startsWith("http") ? src : baseUrl + src
        );
      }
    });

    // 6. ambil daftar campaign
    const campaignLinks = [];
    $banner("a").each((i, el) => {
      const text = $banner(el).text().trim();
      if (
        text &&
        !text.includes("Back to Top") &&
        !text.includes("http")
      ) {
        campaignLinks.push(text);
      }
    });

    // hilangkan duplikat
    const campaigns = [...new Set(campaignLinks)];

    // 7. format pesan
    let message = `*${title}*\n${date}\n\n`;
    message += `Kampanye Aktif:\n\n`;

    campaigns.slice(0, 10).forEach((c, i) => {
      message += `${i + 1}. ${c}\n`;
    });

    message += `\nLink:\n${newsLink}`;

    // 8. kirim pesan text
    await sock.sendMessage(
      chatId,
      { text: message },
      { quoted: msg }
    );

    // 9. kirim banner satu per satu
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
    console.error("[Banner Error]", err);
    await sock.sendMessage(
      chatId,
      {
        text: `Terjadi kesalahan saat mengambil banner.\n\n${err.message}`
      },
      { quoted: msg }
    );
  }
};
