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
const getGroupJid = (chatId) => chatId.endsWith("@g.us") ? chatId : null

/* =====================
   COOLDOWN USER
===================== */

export const ColdownUser = async (sock, chatId, msg, command) => {
  try {
    const groupId = getGroupJid(chatId)
    const userJid = getUserJid(msg)

    // 🔥 GRUP BEBAS COOLDOWN
    const noCdGroups = readJSON(Nocoldown, [])
    if (groupId && noCdGroups.includes(groupId)) return true

    const data = readJSON(Coldwonn, {})
    const key = `${groupId || "private"}:${userJid}`
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
    writeJSON(Coldwonn, data)
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
    if (!chatId.endsWith("@g.us")) {
      return sock.sendMessage(
        chatId,
        { text: "❌ Perintah ini hanya untuk grup." },
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
   CEK COOLDOWN (OPTIONAL)
===================== */

export const CekColdown = async (sock, chatId, msg) => {
  try {
    const groupId = getGroupJid(chatId)
    const userJid = getUserJid(msg)

    const data = readJSON(Coldwonn, {})
    const key = `${groupId || "private"}:${userJid}`

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
