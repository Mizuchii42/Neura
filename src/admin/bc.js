import fs from "fs"

async function getAllGroups(sock) {
  try {
    const groups = await sock.groupFetchAllParticipating()
    return Object.keys(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    return []
  }
}

/**
 * payload:
 * {
 *   text?: string
 *   image?: string | Buffer
 * }
 */
export const bcGroups = async (sock, payload) => {
  const groupJids = await getAllGroups(sock)

  if (groupJids.length === 0) {
    console.log('Tidak ada grup yang ditemukan')
    return 0
  }

  let successCount = 0
  let failedCount = 0

  console.log(`Memulai broadcast ke ${groupJids.length} grup...`)

  for (let i = 0; i < groupJids.length; i++) {
    const jid = groupJids[i]

    try {
      const message = {}

      // === IMAGE ===
      if (payload.image) {
        message.image = Buffer.isBuffer(payload.image)
          ? payload.image
          : payload.image.startsWith("http")
            ? { url: payload.image }
            : fs.readFileSync(payload.image)

        message.caption = payload.text
          ? `*Broadcast*\n\n${payload.text}`
          : '*Broadcast*'
      }

      // === TEXT ONLY ===
      else if (payload.text) {
        message.text = `*Broadcast*\n\n${payload.text}`
      }

      await sock.sendMessage(jid, message)
      successCount++
      console.log(`[${i + 1}/${groupJids.length}] Berhasil → ${jid}`)

    } catch (error) {
      failedCount++
      console.error(`[${i + 1}/${groupJids.length}] Gagal → ${jid}:`, error.message)
    }

    if (i < groupJids.length - 1) {
      await new Promise(res => setTimeout(res, 1500))
    }
  }

  console.log(`\nBroadcast selesai!\nBerhasil: ${successCount}\nGagal: ${failedCount}`)
  return { total: groupJids.length, success: successCount, failed: failedCount }
}

export const handleBroadcast = async (sock, msg) => {
  const chatId = msg.key.remoteJid
  const isGroup = chatId.endsWith("@g.us")

  // ❌ Tolak jika dari grup
  if (isGroup) {
    return sock.sendMessage(chatId, {
      text: "❌ Broadcast hanya bisa dari chat pribadi bot"
    }, { quoted: msg })
  }

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    ""

  const caption = text.replace(/^!bc\s*/i, "").trim()

  if (!caption && !msg.message?.imageMessage) {
    return sock.sendMessage(chatId, {
      text: "Gunakan:\n!bc teks\natau kirim gambar dengan caption !bc"
    }, { quoted: msg })
  }

  await sock.sendMessage(chatId, {
    text: "Broadcast dimulai..."
  }, { quoted: msg })

  // === IMAGE ===
  if (msg.message?.imageMessage) {
    const buffer = await sock.downloadMediaMessage(msg)

    await bcGroups(sock, {
      image: buffer,
      text: caption
    })
  }

  // === TEXT ONLY ===
  else {
    await bcGroups(sock, {
      text: caption
    })
  }

  await sock.sendMessage(chatId, {
    text: "✅ Broadcast selesai"
  })
}

