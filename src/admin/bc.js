import { isOwner } from "../plugins/fitur/ban.js";

export const broadcastGroup = async (sock, chatId, msg, text) => {
  if (!isOwner(sock, msg, chatId)) return;
  const xt = text.replace("!bc", "");

  if (!text) return;

  const groups = Object.keys(sock.chats)
    .filter(id => id.endsWith("@g.us"));

  let success = 0;

  for (const id of groups) {
    try {
      await delay(1500);
      await sock.sendMessage(id, { text: xt });
      success++;
    } catch { }
  }

  await sock.sendMessage(
    chatId,
    { text: `broadcast group selesai\nterkirim: ${success}` },
    { quoted: msg }
  );
};

