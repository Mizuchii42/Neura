import fs from "fs"
import path from "path"

const Coldwon = path.resolve("database", "ColdownUser.json")
const Nocoldown = path.resolve("database", "Nocoldown.json")

const COOLDOWN_TIME = 10 * 1000 // 10 detik

/* =====================
   HELPER
===================== */

const readJSON = (file, def) => {
  if (!fs.existsSync(file)) return def
  return JSON.parse(fs.readFileSync(file))
}

const writeJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

const getUserJid = (msg) => msg.key.participant || msg.key.remoteJid
const isGroup = (chatId) => chatId.endsWith("@g.us")

/* =====================
   COOLDOWN USER
===================== */

export const ColdownUser = async (sock, chatId, msg, command) => {
  try {
    const userJid = getUserJid(msg)

    // 🔥 grup bebas cooldown
    if (isGroup(chatId)) {
      const noCdGroups = readJSON(Nocoldown, [])
      if (noCdGroups.includes(chatId)) return true
    }

    const data = readJSON(Coldwon, {})
    const key = `${isGroup(chatId) ? chatId : "private"}:${userJid}`
    const now = Date.now()

    if (data[key] && now - data[key] < COOLDOWN_TIME) {
      const sisa = Math.ceil(
        (COOLDOWN_TIME - (now - data[key])) / 1000
      )

      await sock.sendMessage(
        chatId,
        { text: `⏳ Tunggu ${sisa} detik untuk *${command}* lagi.` },
        { quoted: msg }
      )
      return false
    }

    data[key] = now
    writeJSON(Coldwon, data)
    return true

  } catch (err) {
    console.error("[CooldownUser]", err)
    return true
  }
}

/* =====================
   SET NO COOLDOWN (GROUP)
===================== */

export const setNocoldown = async (sock, chatId, msg) => {
  try {
    if (!isGroup(chatId)) {
      return sock.sendMessage(
        chatId,
        { text: "❌ Perintah ini hanya bisa di grup." },
        { quoted: msg }
      )
    }

    const data = readJSON(Nocoldown, [])

    if (data.includes(chatId)) {
      return sock.sendMessage(
        chatId,
        { text: "✅ Grup ini sudah bebas cooldown." },
        { quoted: msg }
      )
    }

    data.push(chatId)
    writeJSON(Nocoldown, data)

    await sock.sendMessage(
      chatId,
      { text: "🔥 Cooldown dimatikan untuk grup ini." },
      { quoted: msg }
    )

  } catch (err) {
    console.error("[SetNoCooldown]", err)
  }
}

/* =====================
   CEK COOLDOWN
===================== */

export const CekColdown = async (sock, chatId, msg) => {
  try {
    const userJid = getUserJid(msg)
    const data = readJSON(Coldwon, {})
    const key = `${isGroup(chatId) ? chatId : "private"}:${userJid}`

    if (!data[key]) {
      return sock.sendMessage(
        chatId,
        { text: "✅ Tidak ada cooldown." },
        { quoted: msg }
      )
    }

    const sisa = Math.ceil(
      (COOLDOWN_TIME - (Date.now() - data[key])) / 1000
    )

    if (sisa <= 0) {
      return sock.sendMessage(
        chatId,
        { text: "✅ Cooldown sudah habis." },
        { quoted: msg }
      )
    }

    await sock.sendMessage(
      chatId,
      { text: `⏳ Cooldown tersisa ${sisa} detik.` },
      { quoted: msg }
    )

  } catch (err) {
    console.error("[CekCooldown]", err)
  }
}
