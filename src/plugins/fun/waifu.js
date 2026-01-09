import axios from "axios"

export const waifu = async (sock, chtId, msg) => {
  try {
    const data = await axios.get('https://api.waifu.pics/sfw/waifu')
    const imgdata = data.data.url
    if (!imgdata) return sock.sendMessage(chtId, { text: "gagal mengambil foto" }, { quoted: msg })
    sock.sendMessage(chtId, { image: url(`${imgdata}`) }, { quoted: msg });
  } catch (err) {
    sock.sendMessage(`error internal server\nlog message:${err}`)
  }
}
