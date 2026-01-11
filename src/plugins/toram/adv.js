import { mq_data } from "../fitur/expData.js"

export const floor = Math.floor
export const ceil = Math.ceil

export const getXP = (lv) =>
  floor(0.025 * lv ** 4 + 2 * lv)

export const getTotalXP = (begin, beginPercentage, end) => {
  let xp = floor((1 - beginPercentage / 100) * getXP(begin))
  for (let i = begin + 1; i < end; i++) {
    xp += getXP(i)
  }
  return xp
}

export const addXP = (begin, beginPercentage, extraXP) => {
  let remainingXP = extraXP
  let needXP = (1 - beginPercentage / 100) * getXP(begin)

  if (extraXP < needXP) {
    let currentXP =
      beginPercentage / 100 * getXP(begin) + extraXP
    return [begin, floor(100 * currentXP / getXP(begin))]
  }

  remainingXP -= needXP
  let lv = begin + 1

  while (getXP(lv) <= remainingXP) {
    remainingXP -= getXP(lv)
    lv++
  }

  let lvP = floor(100 * remainingXP / getXP(lv))
  return [lv, lvP]
}




export default async function spamAdv(sock, msg, args) {
  if (args.length < 5) {
    return sock.sendMessage(msg.key.remoteJid, {
      text:
        "Format:\n" +
        "!spamadv <level> <percent> <targetLv> <babMulai> <babAkhir>\n\n" +
        "Contoh:\n!spamadv 180 0 220 2 5"
    }, { quoted: msg })
  }

  const lv = parseInt(args[1])
  const lvP = parseInt(args[2])
  const targetLv = parseInt(args[3])
  let babMulai = parseInt(args[4])
  let babAkhir = parseInt(args[5])

  if ([lv, lvP, targetLv, babMulai, babAkhir].some(isNaN)) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: "Semua parameter harus berupa ANGKA"
    }, { quoted: msg })
  }

  // ✅ AUTO FIX jika kebalik
  if (babMulai > babAkhir) {
    ;[babMulai, babAkhir] = [babAkhir, babMulai]
  }

  const keys = Object.keys(mq_data)

  const startIndex = keys.findIndex(k => k === `Chapter ${babMulai}`)
  const endIndex = keys.findIndex(k => k === `Chapter ${babAkhir + 1}`)

  if (startIndex === -1) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: `Chapter ${babMulai} tidak ditemukan`
    }, { quoted: msg })
  }

  const sliceEnd = endIndex !== -1 ? endIndex : keys.length

  let totalXP = 0
  for (let i = startIndex; i < sliceEnd; i++) {
    const xp = Number(mq_data[keys[i]])
    if (!isNaN(xp)) totalXP += xp
  }

  const [hasilLv, hasilLvP] = addXP(lv, lvP, totalXP)

  const text = `
*SPAM ADV (MAIN QUEST)*

Chapter:
${babMulai} → ${babAkhir}

Total EXP:
${totalXP.toLocaleString()}

Hasil Level:
Lv ${hasilLv} (${hasilLvP}%)
`.trim()

  await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg })
}
