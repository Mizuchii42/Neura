import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const Banner = async (sock, msg, chatId) => {
  try {
    const BASE = "https://id.toram.jp";
    const LIST_URL = `${BASE}/?type_code=all#contentArea`;

    const fixUrl = (url) => {
      if (!url) return null;
      if (url.startsWith("http")) return url;
      return BASE + url;
    };

    /* ================= 1. FETCH HALAMAN LIST ================= */
    const res = await fetch(LIST_URL);
    const html = await res.text();
    const $ = cheerio.load(html);

    // ambil href PERTAMA di list news
    const firstLink = $(".common_list li a").first();
    if (!firstLink.length) {
      throw new Error("Href pertama tidak ditemukan");
    }

    const href = firstLink.attr("href");
    const detailUrl = fixUrl(href);

    if (!detailUrl) {
      throw new Error("Detail URL invalid");
    }

    /* ================= 2. FETCH HALAMAN DETAIL ================= */
    const detailRes = await fetch(detailUrl);
    const detailHtml = await detailRes.text();
    const $detail = cheerio.load(detailHtml);

    /* ================= 3. AMBIL JUDUL & TANGGAL ================= */
    const title = $detail(".news_title").first().text().trim();
    const date = $detail(".news_date time").first().text().trim();

    /* ================= 4. AMBIL LINK KAMPANYE ================= */
    const campaigns = [];
    $detail("#top")
      .nextAll("a")
      .each((_, el) => {
        const text = $detail(el).text().trim();
        if (text && !text.includes("Back to Top")) {
          campaigns.push(text);
        }
      });

    /* ================= 5. AMBIL GAMBAR BANNER ================= */
    const images = [];
    $detail("center img").each((i, el) => {
      const src = $detail(el).attr("src");
      if (
        src &&
        (src.includes("toram_orbitem") || src.includes("toram_avatar"))
      ) {
        images.push(fixUrl(src));
      }
    });

    /* ================= 6. FORMAT PESAN ================= */
    let text = `${date}\n`;
    text += `Kampanye Aktif:\n`;

    campaigns.forEach((c, i) => {
      text += `${i + 1}. ${c}\n`;
    });

    text += `\n> Detail: ${detailUrl}`;

    /* ================= 7. KIRIM PESAN ================= */
    await sock.sendMessage(
      String(chatId),
      { text },
      msg ? { quoted: msg } : {}
    );

    /* ================= 8. KIRIM GAMBAR ================= */
    for (let i = 0; i < images.length; i++) {
      await sock.sendMessage(
        String(chatId),
        {
          image: { url: images[i] },
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
