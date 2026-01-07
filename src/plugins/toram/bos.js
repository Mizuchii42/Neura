import axios from "axios"

const Bossdef = async (sock, chatId, msg, text) => {
  try {
    const name = text.replace("!bos", "").trim()
    if (!name) {
      return sock.sendMessage(
        chatId,
        { text: "Masukkan nama boss setelah !bos" },
        { quoted: msg }
      )
    }

    const res = await axios.get(
      `https://monster-toram.vercel.app/api/monsters/search/${encodeURIComponent(name)}`
    )

    const { count, data } = res.data

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: `Boss "${name}" tidak ditemukan.` },
        { quoted: msg }
      )
    }

    const resultText = data.map((boss, i) => {
      return `
[${i + 1}]
Nama    : ${boss.name.trim()}
Level   : ${boss.level}
Element : ${boss.element.replace("\n", " ")}
HP      : ${boss.hp}
XP      : ${boss.xp}
DEF     : ${boss.def}
MDEF    : ${boss.mdef}
FLEE    : ${boss.flee}
`.trim()
    }).join("\n\n")

    const message = `
Hasil pencarian: ${name}
Ditemukan: ${count} boss

${resultText}
`.trim()

    await sock.sendMessage(
      chatId,
      { text: message },
      { quoted: msg }
    )

  } catch (err) {
    console.error(err)
    await sock.sendMessage(
      chatId,
      { text: "Gagal mengambil data boss." },
      { quoted: msg }
    )
  }
}

export default Bossdef

