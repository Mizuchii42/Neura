import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const Benner = async (sock, chatId, msg, text) => {
  try {
    const targetUrl = "https://en.toram.jp/information/detail/?information_id=10609";

    // 1. Fetch HTML
    const response = await fetch(targetUrl);
    const html = await response.text(); // WAJIB: Convert response ke text
    const $ = cheerio.load(html);

    // 2. Ambil Gambar & Judul
    // ".useBox" adalah class container utama berita di Toram
    let imgRel = $(".useBox img").first().attr("src");
    const title = $(".useBox h1").first().text().trim() || "Toram News";

    if (!imgRel) {
      return sock.sendMessage(
        chatId,
        { text: "⚠️ Gambar banner tidak ditemukan di halaman tersebut." },
        { quoted: msg }
      );
    }

    // 3. Perbaiki URL Relatif (PENTING)
    // Website Toram sering menggunakan path "../img/..."
    let imageUrl = imgRel;

    // 4. Kirim Gambar ke WhatsApp
    await sock.sendMessage(
      chatId,
      {
        image: { url: imageUrl },
        caption: `*${title}*\n\n`
      },
      { quoted: msg }
    );

  } catch (err) {
    console.error("[Benner Error]", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ Terjadi kesalahan saat mengambil banner." },
      { quoted: msg }
    );
  }
}
