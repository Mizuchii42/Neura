import { getUserData, saveUserData } from "../../config/func.js";
import path from "path";
const db = path.resolve("database", "afk/database.json");
export const setAfk = async (sock, chatId, msg, text) => {
  try {
    const pesan = text.replace("!afk", "");

    if (!pesan) return sock.sendMessage(chatId, { text: "harap masukan pesan setelah !afk" }, { quoted: msg })
    const data = getUserData(db)
    const userId = msg.key.participant || msg.key.remoteJid;
    let afkEntry = data.find((i) => i.userId === userId)
    if (!afkEntry) {
      const newAfk = {
        userId,
        note: pesan,
        time: Date.now()
      }
      data.push(newAfk)
      saveUserData(db, data)
      sock.sendMessage(chatId, { text: `anda memasuki mode afk\n note: ${pesan}` }, { quoted: msg });
    }
  } catch (error) {
  }
}

export const checkMentionAfk = async (sock, chatId, msg) => {
  try {
    // Pastikan pesan memiliki mention
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    if (!contextInfo?.mentionedJid) return;

    const data = getUserData(db);
    const mentioned = contextInfo.mentionedJid;

    for (const userId of mentioned) {
      const afkUser = data.find((u) => u.userId === userId);
      if (afkUser) {
        const afkTime = Date.now() - afkUser.time;
        const minutes = Math.floor(afkTime / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        let timeText;
        if (days > 0) timeText = `${days} hari lalu`;
        else if (hours > 0) timeText = `${hours} jam lalu`;
        else if (minutes > 0) timeText = `${minutes} menit lalu`;
        else timeText = "baru saja";

        const caption = `*User ini sedang AFK*\nSejak: ${timeText}\nCatatan: ${afkUser.note}`;

        await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
      }
    }
  } catch (err) {
    console.error("Error di checkMentionAfk:", err);
  }
};


export const checkUnAfk = async (sock, chatId, msg) => {
  try {
    const data = getUserData(db);
    const userId = msg.key.participant || msg.key.remoteJid;

    // Cek apakah user sedang AFK
    const afkIndex = data.findIndex((i) => i.userId === userId);
    if (afkIndex === -1) return; // Tidak AFK, skip

    // Hapus user dari data AFK
    const afkUser = data[afkIndex];
    data.splice(afkIndex, 1);
    saveUserData(db, data);

    // Hitung lama AFK
    const afkTime = Date.now() - afkUser.time;
    const minutes = Math.floor(afkTime / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let timeText;
    if (days > 0) timeText = `${days} hari`;
    else if (hours > 0) timeText = `${hours} jam`;
    else if (minutes > 0) timeText = `${minutes} menit`;
    else timeText = "beberapa detik";

    await sock.sendMessage(chatId, {
      text: `Selamat datang kembali!\nKamu sudah AFK selama ${timeText}.`,
    }, { quoted: msg });
  } catch (err) {
    console.error("Error di checkUnAfk:", err);
  }
};
