import { adminValid } from "../../admin/controlAdmin.js";
import { getUserData, saveUserData } from "../../config/func.js";
import path from "path";

const db = path.resolve("database", "news.json");

export const setNews = async (sock, chatId, msg, text) => {
  try {
    adminValid(sock, chatId, msg, text);
    const newsText = text.replace("!setnews", "").trim();

    if (!newsText) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> gunakan !setnews <isi berita>" },
        { quoted: msg }
      );
    }

    let data = await getUserData(db);

    // pastikan array
    if (!Array.isArray(data)) {
      data = [];
    }

    // cari index berdasarkan id
    const index = data.findIndex(item => item.id === chatId);

    if (index !== -1) {
      // replace jika sudah ada
      data[index].news = newsText;
    } else {
      // tambah jika belum ada
      data.push({
        id: chatId,
        news: newsText
      });
    }

    saveUserData(db, data);

    sock.sendMessage(
      chatId,
      { text: "News berhasil diperbarui" },
      { quoted: msg }
    );

  } catch (err) {
    console.log(err);
    sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan saat menyimpan news" },
      { quoted: msg }
    );
  }
};

export const getNews = async (sock, chatId, msg) => {
  try {
    let data = await getUserData(db);

    if (!Array.isArray(data) || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Belum ada news di grup ini" },
        { quoted: msg }
      );
    }

    const newsData = data.find(item => item.id === chatId);

    if (!newsData || !newsData.news) {
      return sock.sendMessage(
        chatId,
        { text: "Belum ada news di grup ini" },
        { quoted: msg }
      );
    }

    const message = `
*NEWS GROUP*
> By Neura Bot

${newsData.news}
`.trim();

    sock.sendMessage(
      chatId,
      { text: message },
      { quoted: msg }
    );

  } catch (err) {
    console.log(err);
    sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan saat mengambil news" },
      { quoted: msg }
    );
  }
};
