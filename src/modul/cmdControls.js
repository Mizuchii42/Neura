import { hidetag } from "../admin/hidetag.js";
import { buffMessage, menuMessage, messagePembolong } from "../config/variabel.js";
import { isBan } from "../plugins/fitur/ban.js"
import { Benner } from "../plugins/fitur/benner.js";
import { setMenu } from "../plugins/fitur/img.js";
import { getMt } from "../plugins/fitur/mt.js";
import Smeme from "../plugins/fitur/smeme.js";
import sticker from "../plugins/fitur/stiker.js";
import { setAfk } from "../plugins/sosial/afk.js";
import { cekProfile, myBio, myProfile, setDesc, setidBuff, setPP } from "../plugins/sosial/bio.js";
import { getNews, setNews } from "../plugins/sosial/news.js";
import { qc } from "../plugins/sosial/qc.js";
import { getRules, setrules } from "../plugins/sosial/rules.js";
import { searchAbility, searchApp, searchItem, searchRegist, searchXtall } from "../plugins/toram/anyitems.js";
import Bossdef from "../plugins/toram/bos.js";
import { dyePredictor } from "../plugins/toram/dye.js";
import { leveling } from "../plugins/toram/lv.js";
import { clearRaid, createRaid, joinRaid, leaveRaid, viewRaid } from "../plugins/toram/raidControl.js";
export const cmdMenucontrol = async (sock, chatId, msg, text) => {
  if (text.startsWith("!menu")) {
    if (isBan(sock, chatId, msg)) return;
    setMenu(sock, chatId, msg, text);
  }
  if (text.startsWith("!buff")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: buffMessage }, { quoted: msg });
  }

  if (text.startsWith("!creatraid")) {
    if (isBan(sock, chatId, msg)) return;

    const arg = text.split(" ");
    const element = arg[1];
    const hadiah = arg[2];

    if (!element || !hadiah) {
      return sock.sendMessage(
        chatId,
        { text: "Susunan cmd tidak sesuai\n> use !creatRaid <element> <hadiah>" },
        { quoted: msg }
      );
    }

    createRaid(sock, chatId, msg, text, element, hadiah);
  }

  if (text.startsWith("!join")) {
    if (isBan(sock, chatId, msg)) return;

    const args = text.split(" ");
    if (args.length < 3) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> !join <pt1-pt4> <ign>" },
        { quoted: msg }
      );
    }

    joinRaid(sock, chatId, msg, text);
  }
  if (text.startsWith("!raid")) {
    if (isBan(sock, chatId, msg)) return;
    viewRaid(sock, chatId, msg);
  }
  if (text.startsWith("!clearraid")) {
    if (isBan(sock, chatId, msg)) return;
    clearRaid(sock, chatId, msg, text);
  }
  if (text.startsWith("!leave")) {
    if (isBan(sock, chatId, msg)) return;
    leaveRaid(sock, chatId, msg)
  }
  if (text.startsWith("!appview")) {
    if (isBan(sock, chatId, msg)) return;
    searchApp(sock, chatId, msg, text);
  }
  if (text.startsWith("!xtall")) {
    if (isBan(sock, chatId, msg)) return;
    searchXtall(sock, chatId, msg, text);
  }
  if (text.startsWith("!item")) {
    if (isBan(sock, chatId, msg)) return;
    searchItem(sock, chatId, msg, text);
  }
  if (text.startsWith("!regist")) {
    if (isBan(sock, chatId, msg)) return;
    searchRegist(sock, chatId, msg, text);
  }
  if (text.startsWith("!ability")) {
    if (isBan(sock, chatId, msg)) return;
    searchAbility(sock, chatId, msg, text);
  }
  if (text.startsWith("!setnews")) {
    if (isBan(sock, chatId, msg)) return;
    setNews(sock, chatId, msg, text);
  }
  if (text.startsWith("!news")) {
    if (isBan(sock, chatId, msg)) return;
    getNews(sock, chatId, msg);
  }
  if (text.startsWith("!lv")) {
    if (isBan(sock, chatId, msg)) return;
    leveling(sock, chatId, msg, text);
  }
  if (text.startsWith("!hidetag")) {
    if (isBan(sock, chatId, msg)) return;
    hidetag(sock, chatId, msg, text);
  }
  if (text.startsWith("!stiker") || msg.message.imageMessage?.caption === "!stiker") {
    if (isBan(sock, chatId, msg)) return;
    sticker(sock, msg, chatId);
  }
  if (text.startsWith("!bos")) {
    if (isBan(sock, chatId, msg)) return;
    Bossdef(sock, chatId, msg, text)
  }
  if (text.startsWith("!mybio")) {
    if (isBan(sock, chatId, msg)) return;
    myProfile(sock, chatId, msg);
  }
  if (text.startsWith("!setpp") || msg.message.imageMessage?.caption === "!setpp") {
    if (isBan(sock, chatId, msg)) return;
    setPP(sock, chatId, msg);
  }
  if (text.startsWith("!profil")) {
    if (isBan(sock, chatId, msg)) return;
    cekProfile(sock, chatId, msg);
  }
  if (text.startsWith("!setdesc")) {
    if (isBan(sock, chatId, msg)) return;
    setDesc(sock, chatId, msg, text);
  }
  if (text.startsWith("!pembolong")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: messagePembolong }, { quoted: msg })
  }
  if (text.startsWith("!setrules")) {
    if (isBan(sock, chatId, msg)) return;
    setrules(sock, chatId, msg, text)
  }
  if (text.startsWith("!rules")) {
    if (isBan(sock, chatId, msg)) return;
    getRules(sock, chatId, msg)
  }
  if (text.startsWith("!afk")) {
    if (isBan(sock, chatId, msg)) return;
    setAfk(sock, chatId, msg, text);
  }
  if (text.startsWith("!dye")) {
    if (isBan(sock, chatId, msg)) return;
    dyePredictor(sock, chatId, msg, text);
  }
  if (text.startsWith("!qc")) {
    if (isBan(sock, chatId, msg)) return;
    qc(sock, chatId, msg, text);
  }
  if (text.startsWith("!smeme") || msg.message.imageMessage?.caption === "!smeme") {
    if (isBan(sock, chatId, msg)) return;
    Smeme(sock, chatId, msg, text);
  }
  if (text.startsWith("!setbuff")) {
    if (isBan(sock, chatId, msg)) return;
    setidBuff(sock, chatId, msg, text);
  }
  if (text.startsWith("!benner")) {
    if (isBan(sock, chatId, msg)) return;
    Benner(sock, chatId, msg, text);
  }
  if (text.startsWith("!mt")) {
    if (isBan(sock, chatId, msg)) return;
    getMt(sock, chatId, msg)
  }

















}
