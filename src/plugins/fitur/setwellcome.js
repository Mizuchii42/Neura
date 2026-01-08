import { generateWelcomeImage } from "../../config/generate.js"


const ppCache = new Map()

const normalizeJid = (user) => {
  if (typeof user === "string") return user
  if (typeof user === "object" && user?.id) return user.id
  return null
}

const getUserNameFast = (sock, user) => {
  const jid = normalizeJid(user)
  if (!jid) return "User"

  return (
    sock.contacts?.[jid]?.notify ||
    sock.contacts?.[jid]?.name ||
    jid.split("@")[0]
  )
}

const getProfilePictureFast = async (sock, user) => {
  const jid = normalizeJid(user)
  if (!jid) return "https://i.imgur.com/6VBx3io.png"

  if (ppCache.has(jid)) return ppCache.get(jid)

  try {
    const url = await sock.profilePictureUrl(jid, "image")
    ppCache.set(jid, url)
    return url
  } catch {
    return "https://i.imgur.com/6VBx3io.png"
  }
}

export const welcomeGroup = async (sock, update) => {
  try {
    const { id, participants, action } = update
    if (action !== "add") return

    // ⚠️ AMAN: jangan bergantung ke groupMetadata
    const groupName = "Group"

    for (const user of participants) {
      const jid = normalizeJid(user)
      if (!jid) continue

      const userName = getUserNameFast(sock, user)
      const ppUrl = await getProfilePictureFast(sock, user)

      const image = await generateWelcomeImage(
        ppUrl,
        userName,
        groupName
      )

      await sock.sendMessage(id, {
        image,
        caption: `Selamat datang @${jid.split("@")[0]}`,
        mentions: [jid]
      })
    }
  } catch (err) {
    console.error("WELCOME ERROR:", err)
  }
}export const testWelcomeCmd = async (sock, chatId, msg, text) => {
  try {
    if (text !== "!wctest") return
    //if (!chatId.endsWith("@g.us")) return

    const user = msg.key.participant || msg.key.remoteJid
    const userName =
      msg.pushName ||
      sock.contacts?.[user]?.notify ||
      user.split("@")[0]

    const groupName =
      sock.groupMetadataCache?.[chatId]?.subject || "Group"

    let ppUrl
    try {
      ppUrl = await sock.profilePictureUrl(user, "image")
    } catch {
      ppUrl = "https://i.imgur.com/6VBx3io.png"
    }

    const image = await generateWelcomeImage(ppUrl, userName, groupName)

    await sock.sendMessage(chatId, {
      image,
      caption: "TEST WELCOME IMAGE",
      mentions: [user]
    }, { quoted: msg })

  } catch (err) {
    console.error("TEST WELCOME ERROR:", err)
  }
}
