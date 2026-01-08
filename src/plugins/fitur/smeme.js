import { downloadMediaMessage } from "@whiskeysockets/baileys"
import axios from "axios"
import FormData from "form-data"
import dotenv from "dotenv"
dotenv.config()
/* =====================
   HELPER
===================== */
const STICKER_SIZE = 512
const WEBP_QUALITY = 80
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB


const getMediaMessage = (msg) => {
  // gambar langsung
  if (msg.message?.imageMessage) return msg

  // reply gambar
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  if (quoted?.imageMessage) {
    return { message: quoted }
  }

  return null
}

const parseText = (text) => {
  const input = text.replace("!smeme", "").trim()
  const [top = "_", bottom = "_"] = input.split("|")
  return {
    top: encodeURIComponent(top || "_"),
    bottom: encodeURIComponent(bottom || "_")
  }
}

/* =====================
   MAIN
===================== */

const Smeme = async (sock, chatId, msg, text) => {
  try {
    const mediaMsg = getMediaMessage(msg)
    if (!mediaMsg) {
      return sock.sendMessage(
        chatId,
        { text: "Kirim atau reply gambar dengan `!smeme atas|bawah`" },
        { quoted: msg }
      )
    }

    const { top, bottom } = parseText(text)

    // =====================
    // DOWNLOAD IMAGE
    // =====================

    const buffer = await downloadMediaMessage(
      mediaMsg,
      "buffer",
      {},
      { reuploadRequest: sock.updateMediaMessage }
    )

    // =====================
    // UPLOAD KE IMGBB
    // =====================

    const form = new FormData()
    form.append("image", buffer.toString("base64"))

    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?expiration=600&key=${process.env.BB_KEY}`,
      form,
      { headers: form.getHeaders() }
    )

    const imageUrl = upload.data.data.url

    // =====================
    // GENERATE MEME
    // =====================

    const memeUrl = `https://api.memegen.link/images/custom/${top}/${bottom}.png?background=${encodeURIComponent(imageUrl)}`

    // =====================
    // SEND RESULT
    // =====================
    const webpBuffer = await sharp(memeUrl)
      .resize(STICKER_SIZE, STICKER_SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    await sock.sendMessage(
      chatId,
      { sticker: webpBuffer },
      { quoted: msg }
    )

  } catch (err) {
    console.error("[SMEME ERROR]", err)
    await sock.sendMessage(
      chatId,
      { text: "Gagal membuat meme." },
      { quoted: msg }
    )
  }
}

export default Smeme
