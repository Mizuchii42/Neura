import { isBan } from "../plugins/fitur/ban.js";
import { setNews } from "../plugins/sosial/news.js";
import { setrules } from "../plugins/sosial/rules.js";
import { clearRaid, createRaid } from "../plugins/toram/raidControl.js";
import { hidetag } from "./hidetag.js";

export const Admincontrols = async (sock, chatId, msg, text) => {
  try {
    console.log(msg.key.participant)

    const metadata = await sock.groupMetadata(chatId);
    const admin = metadata.participants
      .filter(p => p.admin)
      .map(p => ({
        jid: p.id,
        pn: p.pn,
        role: p.admin
      }));
    const botId = "179573169848377@lid"
    console.log(botId)
    const isAdmin = admin.some(a => a.jid === msg.key.participant)
    const isBotadmin = admin.some(a => a.jid === botId)
    //cmd
    if (text.startsWith("!setrules")) {
      if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      setrules(sock, chatId, msg, text)
    }
    if (text === "!close") {
      if (!isBotadmin) return sock.sendMessage(chatId, { text: "bot tidak diberikan akses admin\njadikan bot sebagai admin grub untuk menggunakan cmd ini" }, { quoted: msg })
      if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      await sock.groupSettingUpdate(chatId, 'announcement');
    }
    if (text === "!open") {
      if (!isBotadmin) return sock.sendMessage(chatId, { text: "bot tidak diberikan akses admin\njadikan bot sebagai admin grub untuk menggunakan cmd ini" }, { quoted: msg })
      if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      await sock.groupSettingUpdate(chatId, 'not_announcement')
    }
    if (text.startsWith("!kick")) {
      if (!isBotadmin) return sock.sendMessage(chatId, { text: "bot tidak diberikan akses admin\njadikan bot sebagai admin grub untuk menggunakan cmd ini" }, { quoted: msg })
      if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!mentions.length) return sock.sendMessage(chatId, { text: "tag target yang akan di kick" }, { quoted: msg });
      await sock.groupParticipantsUpdate(chatId, mentions, 'remove')
    }
    if (text.startsWith("!hidetag")) {
      if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      if (isBan(sock, chatId, msg)) return;
      hidetag(sock, chatId, msg, text);
    }
    if (text.startsWith("!setnews")) {
      if (isBan(sock, chatId, msg)) return;
      if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      setNews(sock, chatId, msg, text);
    }
    if (text.startsWith("!creatraid")) {
      if (isBan(sock, chatId, msg)) return;
      const arg = text.split(" ");
      const element = arg[1];
      const hadiah = arg[2];
      if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      if (!element || !hadiah) {
        return sock.sendMessage(
          chatId,
          { text: "Susunan cmd tidak sesuai\n> use !creatRaid <element> <hadiah>" },
          { quoted: msg }
        );
      }

      createRaid(sock, chatId, msg, text, element, hadiah);
    }
    if (text.startsWith("!clear")) {
      if (isBan(sock, chatId, msg)) return;
      if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      clearRaid(sock, chatId, msg, text);
    }




  } catch (err) {
    console.log(err)
  }
}

export const adminValid = async (sock, chatId, msg, text) => {
  try {
    const metadata = await sock.groupMetadata(chatId);
    const admin = metadata.participants
      .filter(p => p.admin)
      .map(p => ({
        jid: p.id,
        pn: p.pn,
        role: p.admin
      }));
    const isAdmin = admin.some(a => a.jid === msg.key.participant)
    if (!isAdmin) {
      sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg })
      return false
    }
    return true
  } catch (err) {
    console.log(err)
  }
}
export const botValid = async (sock, chatId, msg, text) => {
  try {
    const metadata = await sock.groupMetadata(chatId);
    const admin = metadata.participants
      .filter(p => p.admin)
      .map(p => ({
        jid: p.id,
        pn: p.pn,
        role: p.admin
      }));
    const botId = "179573169848377@lid"
    const isBotadmin = admin.some(a => a.jid === botId)
    if (!isBotadmin) return sock.sendMessage(chatId, { text: "bot tidak menjadi admin" }, { quoted: msg })
    return
  } catch (err) {

  }
}
