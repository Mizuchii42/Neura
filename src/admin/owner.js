import { ban, isOwner, unBan } from "../plugins/fitur/ban.js"
import { setNocoldown } from "./coldownChat.js";

export const ownerControls = async (sock, chatId, msg, text) => {
  if (text.startsWith("!ban")) {
    if (!isOwner(sock, msg, chatId)) return;
    ban(sock, chatId, msg);

  }
  if (text.startsWith("!unban")) {
    unBan(sock, chatId, msg);
  }
  if (text === "!nocdgroup") {
    if (!isOwner(sock, msg, chatId)) return;
    await setNocoldown(sock, chatId, msg)
  }
  if (text.startsWith("!bc")) {

  }
}
