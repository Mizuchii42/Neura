import path from "path";
import { getUserData, saveUserData } from "../../config/func.js";
import { adminValid } from "../../admin/controlAdmin.js";

const db = path.resolve("database", "raid.json");

export const createRaid = async (sock, chatId, msg, text, element, count) => {
  try {
    adminValid(sock, chatId, msg, text);

    const getdata = await getUserData(db);
    const raidExist = getdata.find(item => item.id === chatId);
    if (raidExist) {
      return sock.sendMessage(
        chatId,
        { text: "Party raid sudah dibuat\n> gunakan !clearRaid untuk membubarkan" },
        { quoted: msg }
      );
    }

    const raidData = {
      id: chatId,
      bos_ele: element,
      hadiah: count,
      party: {
        pt1: [],
        pt2: [],
        pt3: [],
        pt4: []
      }
    };

    getdata.push(raidData);
    saveUserData(db, getdata);

    const messageUp = `
Join Party Raid
> !join <pt1-pt4> <ign>\ncontoh: !join pt1 Sheyzo
Element Boss: ${element}
Hadiah: ${count}

pt1 (0/4)
pt2 (0/4)
pt3 (0/4)
pt4 (0/4)
`.trim();

    sock.sendMessage(chatId, { text: messageUp }, { quoted: msg });

  } catch (err) {
    sock.sendMessage(chatId, { text: String(err) }, { quoted: msg });
  }
};

export const joinRaid = async (sock, chatId, msg, text) => {
  try {
    const args = text.split(" ");
    const pt = args[1];
    const ign = args.slice(2).join(" ");

    if (!pt || !ign) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> !join <pt1-pt4> <ign>" },
        { quoted: msg }
      );
    }

    if (!["pt1", "pt2", "pt3", "pt4"].includes(pt)) {
      return sock.sendMessage(
        chatId,
        { text: "Party tidak valid (pt1 - pt4)" },
        { quoted: msg }
      );
    }

    const jid = msg.key.participant || msg.key.remoteJid;

    const data = await getUserData(db);
    const raid = data.find(item => item.id === chatId);

    if (!raid) {
      return sock.sendMessage(
        chatId,
        { text: "Raid belum dibuat\n> gunakan !creatRaid terlebih dahulu" },
        { quoted: msg }
      );
    }

    /* ================= NORMALISASI DATA (FIX ERROR) ================= */

    // jika party masih format lama (array)
    if (Array.isArray(raid.party)) {
      raid.party = {
        pt1: [],
        pt2: [],
        pt3: [],
        pt4: []
      };
    }

    // pastikan setiap pt adalah array
    for (const key of ["pt1", "pt2", "pt3", "pt4"]) {
      if (!Array.isArray(raid.party[key])) {
        raid.party[key] = [];
      }
    }

    /* ================================================================ */

    // cek user sudah join di party manapun
    for (const key of ["pt1", "pt2", "pt3", "pt4"]) {
      if (raid.party[key].some(p => p.jid === jid)) {
        return sock.sendMessage(
          chatId,
          { text: "Kamu sudah join party lain" },
          { quoted: msg }
        );
      }
    }

    // cek kapasitas party
    if (raid.party[pt].length >= 4) {
      return sock.sendMessage(
        chatId,
        { text: `${pt} sudah penuh (4/4)` },
        { quoted: msg }
      );
    }

    // join party
    raid.party[pt].push({
      jid: jid,
      ign: ign
    });

    saveUserData(db, data);

    const list = (p) =>
      raid.party[p].length
        ? raid.party[p].map((u, i) => `${i + 1}. ${u.ign}`).join("\n")
        : "-";

    const message = `
*RAID PARTY UPDATED*
Element Boss : ${raid.bos_ele}
Hadiah       : ${raid.hadiah}

party 1 (${raid.party.pt1.length}/4)
${list("pt1")}

party 2 (${raid.party.pt2.length}/4)
${list("pt2")}

party 3 (${raid.party.pt3.length}/4)
${list("pt3")}

party 4 (${raid.party.pt4.length}/4)
${list("pt4")}

> join: !join <pt1-pt4> <ign>
`.trim();

    sock.sendMessage(chatId, { text: message }, { quoted: msg });

  } catch (err) {
    sock.sendMessage(
      chatId,
      { text: `Error: ${String(err)}` },
      { quoted: msg }
    );
  }
}


export const viewRaid = async (sock, chatId, msg) => {
  try {
    const data = await getUserData(db);
    const raid = data.find(item => item.id === chatId);

    if (!raid) {
      return sock.sendMessage(
        chatId,
        { text: "Raid belum dibuat\n> gunakan !creatRaid terlebih dahulu" },
        { quoted: msg }
      );
    }

    const list = (pt) =>
      raid.party[pt].length
        ? raid.party[pt].map((u, i) => `${i + 1}. ${u.ign}`).join("\n")
        : "-";

    const message = `
*RAID PARTY*
Element Boss : ${raid.bos_ele}
Hadiah       : ${raid.hadiah}

party 1 (${raid.party.pt1.length}/4)
${list("pt1")}

party 2 (${raid.party.pt2.length}/4)
${list("pt2")}

party 3 (${raid.party.pt3.length}/4)
${list("pt3")}

party 4 (${raid.party.pt4.length}/4)
${list("pt4")}

> join party: !join <pt1-pt4> <ign>
`.trim();

    sock.sendMessage(chatId, { text: message }, { quoted: msg });

  } catch (err) {
    sock.sendMessage(
      chatId,
      { text: String(err) },
      { quoted: msg }
    );
  }
};


export const clearRaid = async (sock, chatId, msg, text) => {
  try {
    // validasi admin
    if (adminValid(sock, chatId, msg, text)) return;

    const data = await getUserData(db);

    const index = data.findIndex(item => item.id === chatId);

    if (index === -1) {
      return sock.sendMessage(
        chatId,
        { text: "Tidak ada raid yang aktif di grup ini" },
        { quoted: msg }
      );
    }

    data.splice(index, 1);
    saveUserData(db, data);

    sock.sendMessage(
      chatId,
      { text: "Raid berhasil dibubarkan" },
      { quoted: msg }
    );

  } catch (err) {
    sock.sendMessage(
      chatId,
      { text: String(err) },
      { quoted: msg }
    );
  }
};

export const leaveRaid = async (sock, chatId, msg) => {
  try {
    const jid = msg.key.participant || msg.key.remoteJid;

    const data = await getUserData(db);
    const raid = data.find(item => item.id === chatId);

    if (!raid) {
      return sock.sendMessage(
        chatId,
        { text: "Raid belum dibuat di grup ini" },
        { quoted: msg }
      );
    }

    /* ========= NORMALISASI DATA ========= */
    if (Array.isArray(raid.party)) {
      raid.party = { pt1: [], pt2: [], pt3: [], pt4: [] };
    }

    for (const pt of ["pt1", "pt2", "pt3", "pt4"]) {
      if (!Array.isArray(raid.party[pt])) {
        raid.party[pt] = [];
      }
    }
    /* =================================== */

    let found = false;

    for (const pt of ["pt1", "pt2", "pt3", "pt4"]) {
      const index = raid.party[pt].findIndex(p => p.jid === jid);
      if (index !== -1) {
        raid.party[pt].splice(index, 1);
        found = true;
        break;
      }
    }

    if (!found) {
      return sock.sendMessage(
        chatId,
        { text: "Kamu belum join party mana pun" },
        { quoted: msg }
      );
    }

    saveUserData(db, data);

    const list = (p) =>
      raid.party[p].length
        ? raid.party[p].map((u, i) => `${i + 1}. ${u.ign}`).join("\n")
        : "-";

    const message = `
*RAID PARTY UPDATED*
Element Boss : ${raid.bos_ele}
Hadiah       : ${raid.hadiah}

pt1 (${raid.party.pt1.length}/4)
${list("pt1")}

pt2 (${raid.party.pt2.length}/4)
${list("pt2")}

pt3 (${raid.party.pt3.length}/4)
${list("pt3")}

pt4 (${raid.party.pt4.length}/4)
${list("pt4")}

> join: !join <pt1-pt4> <ign>
`.trim();

    sock.sendMessage(chatId, { text: message }, { quoted: msg });

  } catch (err) {
    sock.sendMessage(
      chatId,
      { text: String(err) },
      { quoted: msg }
    );
  }
};
