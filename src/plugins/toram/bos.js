import axios from 'axios'

const Bossdef = async (sock, chatId, msg, text) => {
  try {
    const name = text.replace("!bos", "").trim()

    if (!name) {
      return sock.sendMessage(
        chatId,
        { text: "Mohon masukkan nama boss setelah perintah !bos" },
        { quoted: msg }
      )
    }

    // Melakukan request ke API
    const res = await axios.get(
      `https://monster-toram.vercel.app/api/monsters/search/${encodeURIComponent(name)}`
    )

    const { count, data } = res.data

    // Validasi ketersediaan data
    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: `Boss dengan nama "${name}" tidak ditemukan dalam basis data.\n jika tidak menemukan bos yang di cari mohon bantu report !report <nama bos>` },
        { quoted: msg }
      )
    }

    // 1. Mengambil entitas boss paling relevan (indeks 0 dari hasil pencarian nama)
    const boss = data[0]

    // 2. Memproses Array 'statdef' secara menyeluruh
    // Kita menggunakan .map() untuk mengonversi setiap objek stat menjadi string terformat
    let statsOutput = ""

    if (boss.statdef && Array.isArray(boss.statdef) && boss.statdef.length > 0) {

      statsOutput = boss.statdef.map((stat) => {
        // A. Header per Tingkat Kesulitan (Difficulty)
        const difficulty = (stat.difficulty || "Normal").toUpperCase()
        const levelInfo = stat.level ? `(Lv ${stat.level})` : ""

        let sectionHeader = `*${difficulty}* ${levelInfo}\n`

        // B. Filter dan Format Detail Statistik
        // Kita exclude 'difficulty' dan 'level' karena sudah ditampilkan di Header
        const blacklistKey = ["difficulty", "level"]

        const details = Object.entries(stat)
          .filter(([key, value]) => {
            if (blacklistKey.includes(key)) return false
            // Hanya tampilkan data yang valid (bukan null, kosong, atau strip)
            return value !== null && value !== "" && value !== "-"
          })
          .map(([key, value]) => {
            // Format Key: snake_case menjadi Title Case (misal: res_phys -> Res Phys)
            const cleanKey = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())

            // Format Value: merapikan string
            const cleanValue = typeof value === "string"
              ? value.replace(/\n/g, " / ")
              : value

            return `> *${cleanKey}* : ${cleanValue}`
          })
          .join("\n")

        return sectionHeader + details
      }).join("\n") // Pemisah antar tingkat kesulitan

    } else {
      statsOutput = "_Data statistik mendetail tidak tersedia._"
    }

    // 3. Menyusun Pesan Akhir
    const message = `
*Analisis Data Boss Toram*
Nama: *${boss.name}*
ID Basis Data: ${boss.id}

────────────────

${statsOutput}

────────────────
_Menampilkan hasil paling relevan dari ${count} data yang ditemukan._
`.trim()

    // Mengirim pesan
    await sock.sendMessage(
      chatId,
      { text: message },
      { quoted: msg }
    )

  } catch (err) {
    console.error("Kesalahan Sistem:", err)
    await sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan internal saat memproses data boss." },
      { quoted: msg }
    )
  }
}

export default Bossdef
