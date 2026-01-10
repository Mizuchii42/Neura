import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const Banner = async (sock, msg, chatId) => {
  try {
    const BASE = "https://id.toram.jp";
    const LIST_URL = "https://id.toram.jp/?type_code=all#contentArea";

    // 1. fetch halaman utama
    const res = await fetch(LIST_URL);
    const html = await res.text();
    const $ = cheerio.load(html);

    /* ==========================
       AMBIL NEWS TERBARU
    ========================== */
    const firstNews = $(".common_list li.news_border a").first();

    if (!firstNews.length) {
      throw new Error("News tidak ditemukan");
    }

    const newsLink = firstNews.attr("href");
    const newsTitle = firstNews.find(".news_title").text().trim();
    const newsDate = firstNews.find("time").text().replace(/[［］]/g, "").trim();

    /* ==========================
       FETCH DETAIL NEWS
    ========================== */
    const detailRes = await fetch(newsLink);
    const detailHtml = await detailRes.text();
    const $detail = cheerio.load(detailHtml);

    // ambil banner image di halaman detail
    const detailImages = [];
    $detail("img").each((i, img) => {
      const src = $detail(img).attr("src");
      if (
        src &&
        (src.includes("toram_") || src.includes("banner"))
      ) {
        detailImages.push(
          src.startsWith("http") ? src : BASE + src
        );
      }
    });

    /* ==========================
       AMBIL EVENT BANNER (540x80)
    ========================== */
    const eventBanners = [];

    $(".event_bn a.banner_link").each((i, el) => {
      const link = $(el).attr("href");
      const img = $(el).find("img").attr("src");
      const alt = $(el).find("img").attr("alt");

      if (img) {
        eventBanners.push({
          title: alt?.trim() || `Banner ${i + 1}`,
          link,
          image: img.startsWith("http") ? img : BASE + img
        });
      }
    });

    /* ==========================
       FORMAT PESAN
    ========================== */
    let message = `*${newsTitle}*\n`;
    message += `${newsDate}\n\n`;
    message += `Event Banner Aktif:\n\n`;

    eventBanners.forEach((b, i) => {
      message += `${i + 1}. ${b.title}\n`;
    });

    message += `\nDetail:\n${newsLink}`;

    /* ==========================
       KIRIM TEXT
    ========================== */
    await sock.sendMessage(
      chatId,
      { text: message },
      { quoted: msg }
    );

    /* ==========================
       KIRIM EVENT BANNER
    ========================== */
    for (let i = 0; i < eventBanners.length; i++) {
      await sock.sendMessage(
        chatId,
        {
          image: { url: eventBanners[i].image },
          caption: eventBanners[i].title
        },
        { quoted: msg }
      );
    }

  } catch (err) {
    console.error("[Toram Banner Error]", err);
    await sock.sendMessage(
      chatId,
      {
        text: `Gagal mengambil banner Toram.\n\n${err.message}`
      },
      { quoted: msg }
    );
  }
};

