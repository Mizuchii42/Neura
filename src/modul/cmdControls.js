import { hidetag } from "../admin/hidetag.js";
import { buffMessage, menuMessage, messagePembolong } from "../config/variabel.js";
import { isBan } from "../plugins/fitur/ban.js"
import sticker from "../plugins/fitur/stiker.js";
import { setAfk } from "../plugins/sosial/afk.js";
import { cekProfile, myBio, myProfile, setDesc, setPP } from "../plugins/sosial/bio.js";
import { getNews, setNews } from "../plugins/sosial/news.js";
import { getRules, setrules } from "../plugins/sosial/rules.js";
import { searchAbility, searchApp, searchItem, searchRegist, searchXtall } from "../plugins/toram/anyitems.js";
import Bossdef from "../plugins/toram/bos.js";
import { dyePredictor } from "../plugins/toram/dye.js";
import { leveling } from "../plugins/toram/lv.js";
import { clearRaid, createRaid, joinRaid, leaveRaid, viewRaid } from "../plugins/toram/raidControl.js";
export const cmdMenucontrol = (sock, chatId, msg, text) => {
  if (text.startsWith("!menu")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: menuMessage }, { quoted: msg });
  }
  if (text.startsWith("!buff")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: buffMessage }, { quoted: msg });
  }

  if (text.startsWith("!creatRaid")) {
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
  if (text.startsWith("!clearRaid")) {
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
  if (text.startsWith("!setNews")) {
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
  if (text.startsWith("!stiker")) {
    if (isBan(sock, chatId, msg)) return;
    sticker(sock, chatId, msg);
  }
  if (text.startsWith("!bos")) {
    if (isBan(sock, chatId, msg)) return;
    Bossdef(sock, chatId, msg, text)
  }
  if (text.startsWith("!mybio")) {
    if (isBan(sock, chatId, msg)) return;
    myProfile(sock, chatId, msg);
  }
  if (text.startsWith("!setPP")) {
    if (isBan(sock, chatId, msg)) return;
    setPP(sock, chatId, msg);
  }
  if (text.startsWith("!cekprofil")) {
    if (isBan(sock, chatId, msg)) return;
    cekProfile(sock, chatId, msg);
  }
  if (text.startsWith("!setDesc")) {
    if (isBan(sock, chatId, msg)) return;
    setDesc(sock, chatId, msg, text);
  }
  if (text.startsWith("!pembolong")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: messagePembolong }, { quoted: msg })
  }
  if (text.startsWith("!setRules")) {
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
















}
