import sharp from "sharp"
import { downloadMediaMessage } from "@whiskeysockets/baileys"

const STICKER_SIZE = 512
const WEBP_QUALITY = 80
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const getMediaMessage = (msg) => {
  // gambar/video langsung
  if (msg.message?.imageMessage || msg.message?.videoMessage) {
    return msg
  }

  // reply gambar/video
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  if (quoted?.imageMessage || quoted?.videoMessage) {
    return { message: quoted }
  }

  return null
}

const sticker = async (sock, msg, chatId) => {
  try {
    const mediaMsg = getMediaMessage(msg)

    if (!mediaMsg) {
      return sock.sendMessage(
        chatId,
        { text: "Kirim atau reply gambar dengan caption `!stiker`" },
        { quoted: msg }
      )
    }

    const buffer = await downloadMediaMessage(
      mediaMsg,
      "buffer",
      {},
      { reuploadRequest: sock.updateMediaMessage }
    )

    if (!buffer || buffer.length > MAX_FILE_SIZE) {
      return sock.sendMessage(
        chatId,
        { text: "Ukuran file terlalu besar (maks 10MB)." },
        { quoted: msg }
      )
    }

    const webpBuffer = await sharp(buffer)
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

    console.log("[Sticker] ✅ Sukses")

  } catch (err) {
    console.error("[Sticker] ❌ Error:", err)
    await sock.sendMessage(
      chatId,
      { text: "❌ Gagal membuat stiker." },
      { quoted: msg }
    )
  }
}



export default sticker

