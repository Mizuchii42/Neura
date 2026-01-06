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

> !join <pt1-pt4> <ign>
contoh: !join pt1 Sheyzo

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

    const data = await getUserData(db);
    const raid = data.find(item => item.id === chatId);

    if (!raid) {
      return sock.sendMessage(
        chatId,
        { text: "Raid belum dibuat\n> gunakan !creatRaid dulu" },
        { quoted: msg }
      );
    }

    // cek sudah join di party manapun
    for (const key of ["pt1", "pt2", "pt3", "pt4"]) {
      if (raid.party[key].some(p => p.jid === msg.key.participant)) {
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

    raid.party[pt].push({
      jid: msg.key.participant,
      ign: ign
    });

    saveUserData(db, data);

    const list = (p) =>
      raid.party[p].length
        ? raid.party[p].map((u, i) => `${i + 1}. ${u.ign}`).join("\n")
        : "-";

    const message = `
*Raid Party*
Element Boss: ${raid.bos_ele}
Hadiah: ${raid.hadiah}

pt1 (${raid.party.pt1.length}/4)
${list("pt1")}

pt2 (${raid.party.pt2.length}/4)
${list("pt2")}

pt3 (${raid.party.pt3.length}/4)
${list("pt3")}

pt4 (${raid.party.pt4.length}/4)
${list("pt4")}
`.trim();

    sock.sendMessage(chatId, { text: message }, { quoted: msg });

  } catch (err) {
    sock.sendMessage(chatId, { text: String(err) }, { quoted: msg });
  }
};


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
=== RAID PARTY ===

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
