import path from "path";
import { getUserData, saveUserData } from "../../config/func.js";

const db = path.resolve("database", "report.json");

export const report = async (sock, chatId, msg, text) => {
  try {
    const rep = text.replace("!report", "").trim();
    if (!rep) {
      return sock.sendMessage(
        chatId,
        { text: "mana text report-nya?" },
        { quoted: msg }
      );
    }

    const data = await getUserData(db);

    const userId = msg.pushName || msg.key.participant;
    let userData = data.find(item => item.id === userId);

    if (!userData) {
      // user baru
      userData = {
        id: userId,
        reports: []
      };
      data.push(userData);
    }

    // tambah report
    userData.reports.push({
      text: rep,
      time: Date.now()
    });

    saveUserData(db, data);

    sock.sendMessage(
      chatId,
      { text: "Report berhasil dikirim" },
      { quoted: msg }
    );

  } catch (err) {
    console.error(err);
    sock.sendMessage(
      chatId,
      { text: "Report gagal dikirim" },
      { quoted: msg }
    );
  }
};

export const getAllReport = async (sock, chatId, msg) => {
  try {
    const data = await getUserData(db);

    if (!data.length) {
      return sock.sendMessage(
        chatId,
        { text: "Belum ada report" },
        { quoted: msg }
      );
    }

    let text = "*DAFTAR REPORT\n*";

    data.forEach(user => {
      text += `*${user.id}*\n`;
      user.reports.forEach((rep, i) => {
        const time = new Date(rep.time).toLocaleString("id-ID");
        text += `  ${i + 1}. ${rep.text}\n     ${time}\n`;
      });
      text += "\n";
    });

    sock.sendMessage(chatId, { text }, { quoted: msg });

  } catch (err) {
    console.error(err);
    sock.sendMessage(
      chatId,
      { text: "❌ Gagal mengambil report" },
      { quoted: msg }
    );
  }
};

