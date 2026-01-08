import { generateWelcomeImage } from "../../config/imgaetext.js"
import { menuMessage } from "../../config/variabel.js"

export const setMenu = async (sock, chatId, msg, text) => {
  try {
    if (text !== "!testwelcome") return
    if (!chatId.endsWith("@g.us")) return

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
      caption: menuMessage,
      mentions: [user]
    }, { quoted: msg })

  } catch (err) {
    console.error("menu:", err)
  }
}

