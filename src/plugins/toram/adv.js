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




export default async function mqExpCommand(sock, msg, args) {
  if (args.length < 5) {
    return sock.sendMessage(msg.key.remoteJid, {
      text:
        "Format:\n" +
        "!spamadv <level> <percent> <targetLv> <babMulai> <babAkhir>"
    }, { quoted: msg })
  }

  const lv = Number(args[0])
  const lvP = Number(args[1])
  const targetLv = Number(args[2])
  const babMulai = Number(args[3])
  const babAkhir = Number(args[4])

  if (babMulai > babAkhir) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Bab mulai tidak boleh lebih besar dari bab akhir"
    }, { quoted: msg })
  }

  const keys = Object.keys(mq_data)
  let totalXP = 0

  for (let bab = babMulai; bab <= babAkhir; bab++) {
    totalXP += Number(mq_data[keys[bab]]) || 0
  }

  const [hasilLv, hasilLvP] = addXP(lv, lvP, totalXP)

  const text = `
*MAIN QUEST (BAB)*

Bab:
${keys[babMulai]} → ${keys[babAkhir]}

Total EXP:
${totalXP.toLocaleString()}

Hasil Level:
Lv ${hasilLv} (${hasilLvP}%)
`.trim()

  await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg })
}

