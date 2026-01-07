
import path from "path";
import fs from "fs";
import { getUserData, saveUserData } from "../../config/func.js";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

const db = path.resolve("db", "profil.json");
const profileDir = path.resolve("db", "profiles");

// Pastikan folder profiles ada
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

export const setPP = async (sock, chatId, msg) => {
  try {
    let imageMessage = null;

    // Cek apakah pesan ini adalah reply ke gambar
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quotedMsg && quotedMsg.imageMessage) {
      imageMessage = quotedMsg.imageMessage;
    } else {
      const messageType = Object.keys(msg.message || {})[0];
      if (messageType === "imageMessage") {
        imageMessage = msg.message.imageMessage;
      }
    }

    // Validasi apakah ada gambar
    if (!imageMessage) {
      await sock.sendMessage(chatId, {
        text: "Silakan kirim gambar atau reply gambar untuk mengatur profile picture.\n\nCara penggunaan:\n• Reply gambar dengan perintah !setpp"
      }, { quoted: msg });
      return;
    }

    // Download gambar
    let buffer;
    if (quotedMsg && quotedMsg.imageMessage) {
      const quotedMsgObj = {
        message: { imageMessage }
      };
      buffer = await downloadMediaMessage(quotedMsgObj, "buffer", {});
    } else {
      buffer = await downloadMediaMessage(msg, "buffer", {});
    }

    // Ambil userId dari pengirim pesan
    const userId = msg.key.remoteJid.endsWith("@s.whatsapp.net")
      ? msg.key.remoteJid
      : msg.key.participant || msg.key.remoteJid;

    // Buat nama file unik berdasarkan userId dan timestamp
    const timestamp = Date.now();
    const fileName = `${userId.split("@")[0]}_${timestamp}.jpg`;
    const filePath = path.join(profileDir, fileName);

    // Simpan gambar ke disk
    fs.writeFileSync(filePath, buffer);

    // Update database
    const data = getUserData(db);
    let userEntry = data.find((user) => user.userId === userId);

    if (!userEntry) {
      const newUser = {
        userId,
        bio: "",
        profilPath: filePath,
      };
      data.push(newUser);
      userEntry = newUser;
    } else {
      // Hapus gambar lama jika ada
      if (userEntry.profilPath && fs.existsSync(userEntry.profilPath)) {
        fs.unlinkSync(userEntry.profilPath);
      }

      // Update path gambar baru
      userEntry.profilPath = filePath;
    }

    saveUserData(db, data);

    await sock.sendMessage(chatId, {
      text: "Profile picture berhasil diatur!"
    }, { quoted: msg });

  } catch (err) {
    console.error("Error setPP:", err);
  };
}

// Fungsi tambahan untuk mendapatkan profile picture
export const getPP = (userId) => {
  try {
    const data = getUserData(db);
    const userEntry = data.find((user) => user.userId === userId);

    if (userEntry && userEntry.profilPath && fs.existsSync(userEntry.profilPath)) {
      return fs.readFileSync(userEntry.profilPath);
    }

    return null;
  } catch (err) {
    console.error("Error getPP:", err);
    return null;
  }
};

// Fungsi untuk mengatur deskripsi/bio
export const setDesc = async (sock, chatId, msg, text) => {
  try {
    const userId = msg.key.remoteJid.endsWith("@s.whatsapp.net")
      ? msg.key.remoteJid
      : msg.key.participant || msg.key.remoteJid;

    // Validasi input
    if (!text || text.trim() === "") {
      await sock.sendMessage(chatId, {
        text: "Silakan masukkan deskripsi bio Anda.\n\nContoh: .setdesc Mahasiswa Informatika | Coding Enthusiast"
      }, { quoted: msg });
      return;
    }

    const description = text.trim();

    if (description.length > 500) {
      await sock.sendMessage(chatId, {
        text: `Deskripsi terlalu panjang.\n\nPanjang karakter: ${description.length}/500\nSilakan persingkat deskripsi Anda.`
      }, { quoted: msg });
      return;
    }

    // Update database
    const data = getUserData(db);
    let userEntry = data.find((user) => user.userId === userId);

    if (!userEntry) {
      const newUser = {
        userId,
        bio: description,
        profilPath: null,
      };
      data.push(newUser);
      userEntry = newUser;
    } else {
      // Timpa bio yang lama dengan yang baru
      userEntry.bio = description;
    }

    saveUserData(db, data);

    await sock.sendMessage(chatId, {
      text: `Bio berhasil diperbarui!\n\n${description}`
    }, { quoted: msg });

  } catch (err) {
    console.error("Error setDesc:", err);
  }
};

// Fungsi untuk melihat bio sendiri
export const myBio = async (sock, chatId, msg) => {
  try {
    const userId = msg.key.remoteJid.endsWith("@s.whatsapp.net")
      ? msg.key.remoteJid
      : msg.key.participant || msg.key.remoteJid;
    const data = getUserData(db);
    const userEntry = data.find((user) => user.userId === userId);

    if (!userEntry || !userEntry.bio) {
      await sock.sendMessage(chatId, {
        text: "Bio belum diatur.\n\nGunakan: !setdesc <deskripsi Anda>"
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(chatId, {
      text: userEntry.bio
    }, { quoted: msg });

  } catch (err) {
    console.error("Error myBio:", err);
  };
}

// Fungsi untuk cek bio user lain dengan mention
export const cekBio = async (sock, chatId, msg) => {
  try {
    // Ambil mentioned user dari pesan
    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (!mentionedJid || mentionedJid.length === 0) {
      await sock.sendMessage(chatId, {
        text: "Silakan mention user yang ingin dicek bio-nya.\n\nContoh: .cekbio @6281234567890"
      }, { quoted: msg });
      return;
    }

    const targetUserId = mentionedJid[0];
    const data = getUserData(db);
    const userEntry = data.find((user) => user.userId === targetUserId);

    if (!userEntry || !userEntry.bio) {
      await sock.sendMessage(chatId, {
        text: "User tersebut belum mengatur bio."
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(chatId, {
      text: userEntry.bio,
      mentions: [targetUserId]
    }, { quoted: msg });

  } catch (err) {
    console.error("Error cekBio:", err);
  }
};

// Fungsi untuk melihat profile lengkap sendiri
export const myProfile = async (sock, chatId, msg) => {
  try {
    const userId = msg.key.remoteJid.endsWith("@s.whatsapp.net")
      ? msg.key.remoteJid
      : msg.key.participant || msg.key.remoteJid;
    const data = getUserData(db);
    const userEntry = data.find((user) => user.userId === userId);

    const hasPP = userEntry && userEntry.profilPath && fs.existsSync(userEntry.profilPath);
    const hasBio = userEntry && userEntry.bio;
    const msgT = `buff:${userEntry?.idBuff || "Belum diatur"}\n${hasBio ? userEntry.bio : ""}`

    // Jika ada PP, kirim gambar dengan bio sebagai caption
    if (hasPP) {
      const ppBuffer = fs.readFileSync(userEntry.profilPath);
      await sock.sendMessage(chatId, {
        image: ppBuffer,
        caption: msgT
      }, { quoted: msg });
    } else {
      // Jika tidak ada PP, kirim bio atau panduan
      const textMessage = hasBio ? userEntry.bio : "Bio belum diatur.\n\nGunakan: !setbio <deskripsi Anda>";
      await sock.sendMessage(chatId, {
        text: textMessage
      }, { quoted: msg });
    }

  } catch (err) {
    console.error("Error myProfile:", err);
  }
};

// Fungsi untuk cek profile user lain dengan mention
export const cekProfile = async (sock, chatId, msg) => {
  try {
    // Ambil mentioned user dari pesan
    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (!mentionedJid || mentionedJid.length === 0) {
      await sock.sendMessage(chatId, {
        text: "Silakan mention user yang ingin dicek profil-nya.\n\nContoh: !cekprofile @6281234567890"
      }, { quoted: msg });
      return;
    }

    const targetUserId = mentionedJid[0];
    const data = getUserData(db);
    const userEntry = data.find((user) => user.userId === targetUserId);

    const hasPP = userEntry && userEntry.profilPath && fs.existsSync(userEntry.profilPath);
    const hasBio = userEntry && userEntry.bio;
    const msgT = `buff:${userEntry?.idBuff || "Belum diatur"}\n${hasBio ? userEntry.bio : ""}`
    // Jika ada PP, kirim gambar dengan bio sebagai caption
    if (hasPP) {
      const ppBuffer = fs.readFileSync(userEntry.profilPath);
      await sock.sendMessage(chatId, {
        image: ppBuffer,
        caption: msgT,
        mentions: [targetUserId]
      }, { quoted: msg });
    } else {
      // Jika tidak ada PP, kirim bio atau info belum diatur
      const textMessage = hasBio ? userEntry.bio : "User ini belum mengatur bio.";
      await sock.sendMessage(chatId, {
        text: textMessage,
        mentions: [targetUserId]
      }, { quoted: msg });
    }

  } catch (err) {
    console.error("Error cekProfile:", err);
  };
}

export const setidBuff = (sock, chatId, msg, arg) => {
  try {
    if (!arg) return sock.sendMessage(chatId, { text: "masukan nama buff serta code setelah .setbuff" }, { quoted: msg })
    const data = getUserData(db);
    const userId = msg.key.remoteJid.endsWith("@s.whatsapp.net")
      ? msg.key.remoteJid
      : msg.key.participant || msg.key.remoteJid;
    let dataentry = data.find((s) => s.userId === userId)
    if (!dataentry) return sock.sendMessage(chatId, { text: "buat terlebih  dahulu desc dengan .desc agar terdaftar di database" }, { quoted: msg })
    dataentry.idBuff = arg.trim()
    saveUserData(db, data);
    sock.sendMessage(chatId, { text: "code buff berhasil di tambahkan" }, { quoted: msg });
  } catch (err) {
  }
}












