import { buffMessage, menuMessage } from "../config/variabel.js";
import { isBan } from "../plugins/fitur/ban.js"
import { searchApp, searchXtall } from "../plugins/toram/anyitems.js";
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

}
