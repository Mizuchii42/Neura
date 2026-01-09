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

    // 3. Ambil HANYA gambar banner kampanye (yang memiliki id section)
    // Banner kampanye ada di section dengan id: s1, s2, s3, s4, s5
    const banners = [];

    // Iterasi setiap section kampanye
    $("h2.deluxetitle[id]").each((index, element) => {
      const sectionId = $(element).attr("id");
      const sectionTitle = $(element).text().trim();

      // Ambil gambar yang ada SETELAH h2 ini (gambar kampanye)
      const nextImg = $(element).next("br").next("center").find("img");

      if (nextImg.length > 0) {
        let imgSrc = nextImg.attr("src");

        if (imgSrc) {
          // Perbaiki URL relatif
          if (imgSrc.startsWith("./")) {
            imgSrc = imgSrc.replace("./", "https://en.toram.jp/information/detail/");
          } else if (!imgSrc.startsWith("http")) {
            imgSrc = "https://en.toram.jp" + imgSrc;
          }

          banners.push({
            url: imgSrc,
            title: sectionTitle,
            section: sectionId
          });
        }
      }
    });

    if (banners.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "⚠️ Tidak ada banner kampanye ditemukan di halaman tersebut." },
        { quoted: msg }
      );
    }

    // 4. Kirim info awal
    await sock.sendMessage(
      chatId,
      {
        text: `mohon tunggu...`
      },
      { quoted: msg }
    );

    // 5. Kirim semua banner kampanye
    for (let i = 0; i < banners.length; i++) {
      try {
        await sock.sendMessage(
          chatId,
          {
            image: { url: banners[i].url },
          },
          { quoted: msg }
        );
      } catch (err) {
        console.error(`Error sending banner ${i + 1}:`, err);
        await sock.sendMessage(
          chatId,
          { text: `⚠️ Gagal mengirim banner: ${banners[i].title}` },
          { quoted: msg }
        );
      }
    }


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
