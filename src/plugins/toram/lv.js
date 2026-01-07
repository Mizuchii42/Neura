import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const leveling = async (sock, chatid, msg, text) => {
  const arg = text.split(" ");
  const lvl = arg[1]
  const gap = arg[2]
  if (!lvl || !gap) return sock.sendMessage(chatid, { text: "format salah\n> use !lv <level mu> <jarak lvl> !lv 250 7" }, { quoted: msg })
  const url = `https://coryn.club/leveling.php?lv=${lvl}&gap=${gap}&bonusEXP=0`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  const body = await response.text();
  const $ = cheerio.load(body);

  const data = [];
  const lvlElements = $("div.level-col-1");
  const namaElements = $("div.level-col-2");
  const len = Math.min(lvlElements.length, namaElements.length);
  for (let i = 0; i < len; i++) {
    const lvl = $(lvlElements[i]).find("b").text().trim();
    const nama = $(namaElements[i]).find("b").text().trim();
    const tempat = $(namaElements[i])
      .find("p")
      .last()
      .text()
      .replace($(namaElements[i]).find("b").text(), "")
      .trim();
    let type = "";
    const parentTable = $(lvlElements[i]).closest("table-grid item-leveling");
    if (parentTable.length) {
      type = parentTable.find("div > h3").first().text().trim();
    }
    data.push({ nama, lvl, tempat, type });
  }
  // Kelompokkan berdasarkan lvl
  const grouped = {};
  data.forEach((item) => {
    if (!grouped[item.lvl]) grouped[item.lvl] = [];
    grouped[item.lvl].push(item);
  });

  // Format pesan WhatsApp tanpa mengurutkan lvl
  let caption =
    "\n> warning: list ini merupakan campuran data bos dan mob biasa, selalu cermati level mob dan bosnya\n\n";
  Object.keys(grouped).forEach((lvlKey) => {
    caption += `*Level ${lvlKey}*\n`;
    grouped[lvlKey].forEach((item) => {
      caption += `• ${item.nama} (${item.tempat})${item.type ? ` [${item.type}]` : ""}\n`;
    });
    caption += "\n";
    caption += "━━━━━━━━━━━━━━━━━━━━\n";
  });
  await sock.sendMessage(chatid, { text: caption.trim() }, { quoted: msg });
};
