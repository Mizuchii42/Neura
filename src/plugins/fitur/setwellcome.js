import { generateWelcomeImage } from "../../config/generate.js"

const ppCache = new Map()
const nameCache = new Map()

/* =======================
   GET USER NAME (FIXED)
======================= */
const getUserName = async (sock, groupId, jid) => {
  if (nameCache.has(jid)) return nameCache.get(jid)

  try {
    const meta = await sock.groupMetadata(groupId)
    const user = meta.participants.find(p => p.id === jid)

    const name =
      user?.notify?.trim() ||
      user?.verifiedName?.trim() ||
      sock.contacts?.[jid]?.notify?.trim() ||
      sock.contacts?.[jid]?.name?.trim() ||
      jid.split("@")[0]

    nameCache.set(jid, name)
    return name
  } catch {
    return jid.split("@")[0]
  }
}

/* =======================
   GET PROFILE PICTURE
======================= */
const getProfilePicture = async (sock, jid) => {
  if (ppCache.has(jid)) return ppCache.get(jid)

  try {
    const url = await sock.profilePictureUrl(jid, "image")
    ppCache.set(jid, url)
    return url
  } catch {
    const defaultPP = "https://i.imgur.com/6VBx3io.png"
    ppCache.set(jid, defaultPP)
    return defaultPP
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
      try {
        const userName = await getUserName(sock, id, jid)
        const ppUrl = await getProfilePicture(sock, jid)
        const image = await generateWelcomeImage(ppUrl, userName, groupName)

        await sock.sendMessage(id, {
          image: image,
          caption: `Welcome *${userName}* to *${groupName}*! 🎉`,
          mentions: [jid]
        })
      } catch (error) {
        console.error(`Welcome failed for ${jid}:`, error)
      }
    }
  } catch (error) {
    console.error("Welcome handler error:", error)
  }
}
