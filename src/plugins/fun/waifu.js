import axios from "axios";

export const waifu = async (sock, chatId, msg) => {
  try {

    const { data } = await axios.get("https://api.waifu.pics/sfw/waifu");

    if (!data?.url) {
      return sock.sendMessage(
        chatId,
        { text: "gagal mengambil foto" },
        { quoted: msg }
      );
    }

    await sock.sendMessage(
      chatId,
      {
        image: { url: data.url },
        caption: "waifu"
      },
      { quoted: msg }
    );

  } catch (err) {
    await sock.sendMessage(
      chatId,
      { text: `error internal server\n${err.message}` },
      { quoted: msg }
    );
  }
};
