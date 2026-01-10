async function getAllGroups(sock) {
  try {
    const groups = await sock.groupFetchAllParticipating()
    return Object.keys(groups) // array JID grup
  } catch (error) {
    console.error('Error fetching groups:', error)
    return []
  }
}

export const broadcastAllGroups = async (sock, pesan) => {
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
      await sock.sendMessage(jid, {
        text: `*Broadcast*\n\n${pesan}`
      })
      successCount++
      console.log(`[${i + 1}/${groupJids.length}] Berhasil kirim ke grup: ${jid}`)
    } catch (error) {
      failedCount++
      console.error(`[${i + 1}/${groupJids.length}] Gagal kirim ke grup ${jid}:`, error.message)
    }

    // Delay 1.5 detik (AMAN) - kecuali untuk pesan terakhir
    if (i < groupJids.length - 1) {
      await new Promise(res => setTimeout(res, 1500))
    }
  }

  console.log(`\nBroadcast selesai!\nBerhasil: ${successCount}\nGagal: ${failedCount}`)
  return { total: groupJids.length, success: successCount, failed: failedCount }
}

// Fungsi tambahan: broadcast dengan filter
export const broadcastFilteredGroups = async (sock, pesan, filterFn) => {
  const groups = await sock.groupFetchAllParticipating()
  const filteredJids = Object.entries(groups)
    .filter(([jid, group]) => filterFn(group))
    .map(([jid]) => jid)

  let successCount = 0
  let failedCount = 0

  console.log(`Memulai broadcast ke ${filteredJids.length} grup (filtered)...`)

  for (let i = 0; i < filteredJids.length; i++) {
    const jid = filteredJids[i]
    try {
      await sock.sendMessage(jid, {
        text: `*Broadcast*\n\n${pesan}`
      })
      successCount++
      console.log(`[${i + 1}/${filteredJids.length}] Berhasil kirim ke grup: ${jid}`)
    } catch (error) {
      failedCount++
      console.error(`[${i + 1}/${filteredJids.length}] Gagal kirim ke grup ${jid}:`, error.message)
    }

    if (i < filteredJids.length - 1) {
      await new Promise(res => setTimeout(res, 1500))
    }
  }

  return { total: filteredJids.length, success: successCount, failed: failedCount }
}

// Contoh penggunaan:
// import { broadcastAllGroups, broadcastFilteredGroups } from './bc.js'

// Broadcast ke semua grup
// const result = await broadcastAllGroups(sock, 'Halo semua!')

// Broadcast hanya ke grup dengan jumlah anggota > 50
// const result = await broadcastFilteredGroups(
//   sock,
//   'Pesan penting!',
//   (group) => group.participants.length > 50
// )
