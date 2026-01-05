import { getUserData, saveUserData } from "./../../config/func.js"
import path from "path"
const dbPath = path.resolve("database", "banned.json")
import fs from "fs"

export const ban = async (sock, chatId, msg) => {
  try {
    const mention =
      msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid

    if (!mention || mention.length === 0) {
      await sock.sendMessage(chatId, {
        text: "❌ Tag seseorang untuk ban!\n\nContoh: .ban @user",
      })
      return
    }

    const target = mention[0]
    const getData = getUserData(dbPath)

    const existingBan = getData.find(
      (entry) =>
        entry.ban &&
        entry.ban.some(
          (ban) => ban.userid === target && ban.value === true
        )
    )

    if (existingBan) {
      await sock.sendMessage(chatId, {
        text: `❌ @${target.split("@")[0]} sudah dalam status banned!`,
        mentions: [target],
      })
      return
    }

    let dataEntry = getData.find((entry) => entry.id === target)
    if (!dataEntry) {
      dataEntry = {
        id: target,
        ban: [],
      }
      getData.push(dataEntry)
    }

    const newBan = {
      userid: target,
      value: true,
      timestamp: new Date().toISOString(),
      bannedBy:
        msg?.key?.participant ||
        msg?.key?.remoteJid ||
        "unknown",
    }

    dataEntry.ban.push(newBan)
    saveUserData(dbPath, getData)

    await sock.sendMessage(
      chatId,
      {
        text: `@${target.split("@")[0]} telah dibanned!`,
        mentions: [target],
      },
      { quoted: msg }
    )
  } catch (error) {
    console.error("Error in ban function:", error)
    await sock.sendMessage(chatId, {
      text: "Terjadi kesalahan saat melakukan ban.",
    })
  }
}

export const isBan = (sock, chatId, msg) => {
  try {
    const userId =
      msg?.key?.participant ||
      msg?.key?.remoteJid

    if (!userId) return false

    const data = getUserData(dbPath)
    const userData = data.find(
      (entry) =>
        entry.ban &&
        entry.ban.some(
          (ban) => ban.userid === userId && ban.value === true
        )
    )

    if (userData) {
      sock.sendMessage(
        chatId,
        { text: "anda di ban" },
        { quoted: msg }
      )
      return true
    }
    return false
  } catch (error) {
    console.error("Error in isBan function:", error)
    return false
  }
}

export const isOwner = (sock, msg, chatId) => {
  const userJid =
    msg?.key?.participant ||
    msg?.key?.remoteJid

  if (!userJid) return false

  const ownerNumber = "272206605082689@lid"

  if (userJid !== ownerNumber) {
    sock.sendMessage(chatId, {
      text: "anda tidak bisa menggunakan cmd ini!!",
    })
    return false
  }
  return true
}

export const unBan = async (sock, chatId, msg) => {
  try {
    const mention =
      msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid

    if (!mention || mention.length === 0) {
      await sock.sendMessage(chatId, {
        text: "Tag seseorang untuk unban!\n\nContoh: .unban @user",
      })
      return
    }

    const target = mention[0]
    const getData = getUserData(dbPath)

    const dataUserIndex = getData.findIndex(
      (entry) => entry.id === target
    )

    if (dataUserIndex === -1) {
      return sock.sendMessage(
        chatId,
        { text: "User tidak ditemukan dalam database." },
        { quoted: msg }
      )
    }

    const user = getData[dataUserIndex]

    if (!user.ban || !Array.isArray(user.ban)) {
      return sock.sendMessage(
        chatId,
        { text: "User tidak memiliki data ban." },
        { quoted: msg }
      )
    }

    const isBanned = user.ban.some(
      (banEntry) =>
        banEntry.userid === target &&
        banEntry.value === true
    )

    if (!isBanned) {
      return sock.sendMessage(
        chatId,
        { text: "User ini tidak sedang diban." },
        { quoted: msg }
      )
    }

    user.ban = user.ban.map((banEntry) =>
      banEntry.userid === target
        ? { ...banEntry, value: false }
        : banEntry
    )

    fs.writeFileSync(
      dbPath,
      JSON.stringify(getData, null, 2)
    )

    await sock.sendMessage(
      chatId,
      { text: "User berhasil di-unban." },
      { quoted: msg }
    )
  } catch (error) {
    console.error("Error in unBan function:", error)
    await sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan saat unban." },
      { quoted: msg }
    )
  }
}
