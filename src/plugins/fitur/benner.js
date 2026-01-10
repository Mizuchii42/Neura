import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const Banner = async (sock, msg, chatId) => {
  try {
    const BASE = "https://id.toram.jp";
    const LIST_URL = `${BASE}/?type_code=all#contentArea`;

    const fixUrl = (url) => {
      if (!url) return null;
      return url.startsWith("http") ? url : BASE + url;
    };

    /* ================= FETCH LIST ================= */
    const res = await fetch(LIST_URL);
    const html = await res.text();
    const $ = cheerio.load(html);

    // ambil href pertama
    const firstHref = $(".common_list li a").first().attr("href");
    if (!firstHref) throw new Error("Href pertama tidak ditemukan");

    const detailUrl = fixUrl(firstHref);

    /* ================= FETCH DETAIL ================= */
    const detailRes = await fetch(detailUrl);
    const detailHtml = await detailRes.text();
    const $detail = cheerio.load(detailHtml);

    /* ================= AMBIL NAMA + GAMBAR BANNER ================= */
    const banners = [];

    $detail("a").each((i, el) => {
      const name = $detail(el).text().trim();
      if (!name || name.includes("Back to Top")) return;

      const img = $detail(el)
        .nextAll("img")
        .first()
        .attr("src");

      if (img) {
        banners.push({
          title: name,
          image: fixUrl(img)
        });
      }
    });

    if (!banners.length) {
      throw new Error("Banner tidak ditemukan");
    }

    /* ================= KIRIM GAMBAR + CAPTION ================= */
    for (const b of banners) {
      await sock.sendMessage(
        String(chatId),
        {
          image: { url: b.image },
          caption: b.title
        },
        msg ? { quoted: msg } : {}
      );
    }

  } catch (err) {
    console.error("[Toram Banner Error]", err);
    await sock.sendMessage(
      String(chatId),
      { text: `Gagal ambil banner Toram.\n\n${err.message}` },
      msg ? { quoted: msg } : {}
    );
  }
};
