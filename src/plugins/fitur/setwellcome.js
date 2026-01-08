import { generateWelcomeImage } from "../../config/generate.js"


const ppCache = new Map()
const nameCache = new Map()

/* =======================
   HELPER
======================= */

const normalizeJid = (user) => {
  if (typeof user === "string") return user
  if (typeof user === "object" && user?.id) return user.id
  return null
}

/* =======================
   GET USER NAME (PALING AKURAT)
======================= */

const getUserNameFromGroup = async (sock, groupId, jid) => {
  if (nameCache.has(jid)) return nameCache.get(jid)

  try {
    const meta = await sock.groupMetadata(groupId)
    const user = meta.participants.find(p => p.id === jid)

    const name =
      user?.notify ||
      user?.name ||
      sock.contacts?.[jid]?.notify ||
      sock.contacts?.[jid]?.name ||
      jid.split("@")[0]

    nameCache.set(jid, name)
    return name
  } catch {
    return jid.split("@")[0]
  }
}

/* =======================
   GET PROFILE PICTURE (FAST + CACHE)
======================= */

const getProfilePictureFast = async (sock, jid) => {
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

/* =======================
   WELCOME HANDLER
======================= */

export const welcomeGroup = async (sock, update) => {
  try {
    const { id, participants, action } = update
    if (action !== "add") return

    const meta = await sock.groupMetadata(id)
    const groupName = meta.subject || "Group"

    for (const jid of participants) {
      const userName = await getUserNameFromGroup(sock, id, jid)
      const ppUrl = await getProfilePictureFast(sock, jid)

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
}
export const testWelcomeCmd = async (sock, chatId, msg, text) => {
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
