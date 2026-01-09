import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const Benner = async (sock, chatId, msg, text) => {
  try {
    const targetUrl = "https://en.toram.jp/information/detail/?information_id=10609";

    // 1. Fetch HTML
    const response = await fetch(targetUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    // 2. Ambil judul
    const title = $(".useBox h1").first().text().trim() || "Toram News";

    // 3. Ambil SEMUA gambar banner dari dalam .useBox
    const banners = [];
    $(".useBox center img").each((index, element) => {
      let imgSrc = $(element).attr("src");

      if (imgSrc) {
        // Perbaiki URL relatif jika diperlukan
        if (imgSrc.startsWith("./")) {
          imgSrc = imgSrc.replace("./", "https://en.toram.jp/information/detail/");
        } else if (!imgSrc.startsWith("http")) {
          imgSrc = "https://en.toram.jp" + imgSrc;
        }

        banners.push({
          url: imgSrc,
          alt: $(element).attr("alt") || `Banner ${index + 1}`
        });
      }
    });

    if (banners.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "⚠️ Tidak ada gambar banner ditemukan di halaman tersebut." },
        { quoted: msg }
      );
    }

    // 4. Kirim info dan semua banner langsung
    await sock.sendMessage(
      chatId,
      {
        text: `📰 *${title}*\n\n✨ Ditemukan ${banners.length} banner\nMengirim semua banner...`
      },
      { quoted: msg }
    );

    // 5. Kirim semua banner
    for (let i = 0; i < banners.length; i++) {
      try {
        await sock.sendMessage(
          chatId,
          {
            image: { url: banners[i].url },
            caption: `*Banner ${i + 1}/${banners.length}*\n📌 ${title}`
          },
          { quoted: msg }
        );

        // Delay untuk menghindari spam
        if (i < banners.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (err) {
        console.error(`Error sending banner ${i + 1}:`, err);
        await sock.sendMessage(
          chatId,
          { text: `⚠️ Gagal mengirim banner ${i + 1}` },
          { quoted: msg }
        );
      }
    }

    // 6. Kirim pesan selesai
    await sock.sendMessage(
      chatId,
      { text: `✅ Selesai mengirim ${banners.length} banner!` },
      { quoted: msg }
    );

  } catch (err) {
    console.error("[Benner Error]", err);
    await sock.sendMessage(
      chatId,
      {
        text: `❌ Terjadi kesalahan saat mengambil banner.\n\n🔍 Detail Error:\n${err.message}`
      },
      { quoted: msg }
    );
  }
};
