export const subMenu = async (sock, chatId, msg, text) => {
  try {
    if (text.startsWith("!menuadmin")) { }
    if (text.startsWith("!menugrub")) { }
    if (text.startsWith("!menutoram")) { }
    if (text.startsWith("!menuafun")) { }
    if (text.startsWith("!menuatools")) { }
  } catch (err) {
    sock.sendMessage(chatId, { text: "terjadi kesalahan saat mengirim pesan" }, { quoted: msg })
  }
}
