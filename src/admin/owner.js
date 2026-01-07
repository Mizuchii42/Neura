import { ban, isOwner, unBan } from "../plugins/fitur/ban.js"

export const ownerControls = async (sock, chatId, msg, text) => {
  if (text.startsWith("!ban")) {
    if (!isOwner(sock, msg, chatId)) return;
    ban(sock, chatId, msg);

  }
  if (text.startsWith("!unban")) {
    if (!isOwner(sock, msg, chatId)) return;
    unBan(sock, chatId, msg);
  }
}
