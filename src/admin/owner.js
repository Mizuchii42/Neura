import { ban, isOwner, unBan } from "../plugins/fitur/ban.js"
import { handleBroadcast } from "./bc.js";
import { setNocoldown } from "./coldownChat.js";

export const ownerControls = async (sock, chatId, msg, text) => {
  if (text.startsWith("!ban")) {
    if (!isOwner(sock, msg, chatId)) return;
    ban(sock, chatId, msg);

  }
  if (text.startsWith("!unban")) {
    if (!isOwner(sock, msg, chatId)) return;
    unBan(sock, chatId, msg);
  }
  if (text === "!nocdgroup") {
    if (!isOwner(sock, msg, chatId)) return;
    await setNocoldown(sock, chatId, msg)
  }
  if (text.startsWith("!bc")) {
    if (!isOwner(sock, msg, chatId)) return;
    handleBroadcast(sock, msg);
  }
}
