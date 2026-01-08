import axios from "axios";
import sharp from "sharp";

const STICKER_SIZE = 512;
const WEBP_QUALITY = 80;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const qc = async (sock, chatId, msg, text) => {
  try {
    const message = text.replace("!qc", "");
    if (!message) return sock.sendMessage(chatId, { text: "mana textnya?" }, { quoted: msg });

    const pp = "https://telegra.ph/file/24fa902ead26340f3df2c.png";
    const name = msg.pushName;

    const obj = {
      "type": "quote",
      "format": "png",
      "backgroundColor": "#000000",
      "width": 1024,
      "height": 1024,
      "scale": 2,
      "messages": [{
        "entities": [],
        "avatar": true,
        "from": {
          "id": 1,
          "name": `${name}`,
          "photo": { url: `${pp}` }
        },
        "text": message.trim(),
        "replyMessage": {}
      }]
    };

    const { data } = await axios.post("https://bot.lyo.su/quote/generate", obj, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const buffer = Buffer.from(data.result.image, 'base64');

    // Perbaiki chain sharp dengan await
    const sticker = await sharp(buffer)
      .resize(STICKER_SIZE, STICKER_SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    await sock.sendMessage(chatId, {
      sticker: sticker,
      mimetype: "image/webp"
    }, { quoted: msg });

  } catch (err) {
    console.error('Error in qc:', err);
    await sock.sendMessage(chatId, {
      text: `Error: ${err.message || 'Gagal membuat sticker'}`
    }, { quoted: msg });
  }
}
