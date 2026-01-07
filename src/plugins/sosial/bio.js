import path from "path";
import fs from "fs";
import { getUserData, saveUserData } from "../../config/func.js";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

const db = path.resolve("db", "profil.json");
const profileDir = path.resolve("db", "profiles");

if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

/* =======================
   HELPER
======================= */
const getUserId = (msg) => {
  return msg.key.remoteJid.endsWith("@s.whatsapp.net")
    ? msg.key.remoteJid
    : msg.key.participant || msg.key.remoteJid;
};

/* =======================
   SET PROFILE PICTURE
======================= */
export const setPP = async (sock, chatId, msg) => {
  try {
    let imageMessage;

    const quoted =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (quoted?.imageMessage) {
      imageMessage = quoted.imageMessage;
    } else if (msg.message?.imageMessage) {
      imageMessage = msg.message.imageMessage;
    }

    if (!imageMessage) {
      return sock.sendMessage(
        chatId,
        {
          text:
            "Silakan kirim atau reply gambar.\n\nContoh:\n• Reply gambar dengan !setpp",
        },
        { quoted: msg }
      );
    }

    const buffer = await downloadMediaMessage(
      {
        key: msg.key,
        message: { imageMessage },
      },
      "buffer",
      {}
    );

    const userId = getUserId(msg);
    const fileName = `${userId.split("@")[0]}_${Date.now()}.jpg`;
    const filePath = path.join(profileDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const data = getUserData(db);
    let user = data.find((u) => u.userId === userId);

    if (!user) {
      user = { userId, bio: "", profilPath: filePath, idBuff: null };
      data.push(user);
    } else {
      if (user.profilPath && fs.existsSync(user.profilPath)) {
        fs.unlinkSync(user.profilPath);
      }
      user.profilPath = filePath;
    }

    saveUserData(db, data);

    await sock.sendMessage(
      chatId,
      { text: "Profile picture berhasil diatur!" },
      { quoted: msg }
    );
  } catch (err) {
    console.error("Error setPP:", err);
  }
};

/* =======================
   SET BIO
======================= */
export const setDesc = async (sock, chatId, msg, text) => {
  try {
    if (!text?.trim()) {
      return sock.sendMessage(
        chatId,
        {
          text:
            "Masukkan deskripsi bio.\n\nContoh:\n!setdesc Mahasiswa | Coding",
        },
        { quoted: msg }
      );
    }

    if (text.length > 500) {
      return sock.sendMessage(
        chatId,
        { text: `Bio terlalu panjang (${text.length}/500)` },
        { quoted: msg }
      );
    }

    const userId = getUserId(msg);
    const data = getUserData(db);

    let user = data.find((u) => u.userId === userId);

    if (!user) {
      user = { userId, bio: text.trim(), profilPath: null, idBuff: null };
      data.push(user);
    } else {
      user.bio = text.trim();
    }

    saveUserData(db, data);

    sock.sendMessage(
      chatId,
      { text: "Bio berhasil diperbarui!" },
      { quoted: msg }
    );
  } catch (err) {
    console.error("Error setDesc:", err);
  }
};

/* =======================
   MY BIO
======================= */
export const myBio = async (sock, chatId, msg) => {
  try {
    const userId = getUserId(msg);
    const data = getUserData(db);
    const user = data.find((u) => u.userId === userId);

    if (!user?.bio) {
      return sock.sendMessage(
        chatId,
        { text: "Bio belum diatur.\nGunakan !setdesc" },
        { quoted: msg }
      );
    }

    sock.sendMessage(chatId, { text: user.bio }, { quoted: msg });
  } catch (err) {
    console.error("Error myBio:", err);
  }
};

/* =======================
   CEK BIO ORANG
======================= */
export const cekBio = async (sock, chatId, msg) => {
  try {
    const mention =
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    if (!mention) {
      return sock.sendMessage(
        chatId,
        { text: "Mention user.\nContoh: !cekbio @628xxxx" },
        { quoted: msg }
      );
    }

    const data = getUserData(db);
    const user = data.find((u) => u.userId === mention);

    if (!user?.bio) {
      return sock.sendMessage(
        chatId,
        { text: "User belum mengatur bio." },
        { quoted: msg }
      );
    }

    sock.sendMessage(
      chatId,
      { text: user.bio, mentions: [mention] },
      { quoted: msg }
    );
  } catch (err) {
    console.error("Error cekBio:", err);
  }
};

/* =======================
   MY PROFILE
======================= */
export const myProfile = async (sock, chatId, msg) => {
  try {
    const userId = getUserId(msg);
    const data = getUserData(db);
    const user = data.find((u) => u.userId === userId);

    if (!user) {
      return sock.sendMessage(
        chatId,
        { text: "Profil belum dibuat." },
        { quoted: msg }
      );
    }

    const caption = `buff: ${user.idBuff || "Belum diatur"}\n${user.bio || ""}`;

    if (user.profilPath && fs.existsSync(user.profilPath)) {
      return sock.sendMessage(
        chatId,
        {
          image: fs.readFileSync(user.profilPath),
          caption,
        },
        { quoted: msg }
      );
    }

    sock.sendMessage(
      chatId,
      { text: caption || "Profil kosong." },
      { quoted: msg }
    );
  } catch (err) {
    console.error("Error myProfile:", err);
  }
};

/* =======================
   CEK PROFILE ORANG
======================= */
export const cekProfile = async (sock, chatId, msg) => {
  try {
    const mention =
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    if (!mention) {
      return sock.sendMessage(
        chatId,
        { text: "Mention user.\nContoh: !cekprofile @628xxxx" },
        { quoted: msg }
      );
    }

    const data = getUserData(db);
    const user = data.find((u) => u.userId === mention);

    if (!user) {
      return sock.sendMessage(
        chatId,
        { text: "Profil tidak ditemukan." },
        { quoted: msg }
      );
    }

    const caption = `buff: ${user.idBuff || "Belum diatur"}\n${user.bio || ""}`;

    if (user.profilPath && fs.existsSync(user.profilPath)) {
      return sock.sendMessage(
        chatId,
        {
          image: fs.readFileSync(user.profilPath),
          caption,
          mentions: [mention],
        },
        { quoted: msg }
      );
    }

    sock.sendMessage(
      chatId,
      { text: caption, mentions: [mention] },
      { quoted: msg }
    );
  } catch (err) {
    console.error("Error cekProfile:", err);
  }
};

/* =======================
   SET BUFF
======================= */
export const setidBuff = async (sock, chatId, msg, arg) => {
  try {
    if (!arg?.trim()) {
      return sock.sendMessage(
        chatId,
        { text: "Masukkan code buff.\nContoh: !setbuff ATK+10%" },
        { quoted: msg }
      );
    }

    const userId = getUserId(msg);
    const data = getUserData(db);
    const user = data.find((u) => u.userId === userId);

    if (!user) {
      return sock.sendMessage(
        chatId,
        { text: "Buat bio terlebih dahulu dengan !setdesc" },
        { quoted: msg }
      );
    }

    user.idBuff = arg.trim();
    saveUserData(db, data);

    sock.sendMessage(
      chatId,
      { text: "Buff berhasil disimpan." },
      { quoted: msg }
    );
  } catch (err) {
    console.error("Error setidBuff:", err);
  }
};
