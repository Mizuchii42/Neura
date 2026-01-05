import { menuMessage } from "../config/variabel.js";
import { isBan } from "../plugins/fitur/ban.js"
export const cmdMenucontrol = (sock, chatId, msg, text) => {
  if (text.startsWith("!menu")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: menuMessage }, { quoted: msg });
  }

}
