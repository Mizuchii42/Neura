import puppeteer from "puppeteer";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Scrape data dari Google Sheets
const scrapeSheetData = async (url) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    await page.waitForSelector("table", { timeout: 10000 });
    await delay(2000);

    const data = await page.evaluate(() => {
      const table = document.querySelector("table");
      if (!table) return [];

      const rows = table.querySelectorAll("tr");
      if (rows.length === 0) return [];

      const headerCells = rows[0].querySelectorAll("th, td");
      const headers = Array.from(headerCells).map(cell =>
        cell.textContent.trim()
      );

      const list = [];
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll("td");
        if (cells.length === 0) continue;

        const item = {};
        cells.forEach((cell, idx) => {
          const header = headers[idx];
          if (header) {
            item[header] = cell.textContent.trim();
          }
        });

        if (Object.keys(item).length > 0) {
          list.push(item);
        }
      }

      return list;
    });

    await browser.close();
    return data;

  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
};

// Handler untuk bot Baileys
export const handleBossCommand = async (sock, msg, searchQuery) => {
  const jid = msg.key.remoteJid;

  try {
    if (!searchQuery || searchQuery.trim() === '') {
      await sock.sendMessage(jid, {
        text: "Silakan masukkan nama boss/miniboss.\n\nContoh: !bosdef venena"
      });
      return;
    }

    await sock.sendMessage(jid, { text: "Mengambil data..." });

    // Ambil data dari kedua sheet
    const [bossData, minibossData] = await Promise.all([
      scrapeSheetData("https://docs.google.com/spreadsheets/d/1s_CcLFFUeyP28HaHrJtRcTh06YVujO8boa4SzWwvy-M/htmlview"),
      scrapeSheetData("https://docs.google.com/spreadsheets/d/1FOb_YkYNuw_EUWNg5AFo5PfuuupKzeT592FZ_mazXXk/htmlview")
    ]);

    const allData = [...bossData, ...minibossData];

    // Cari berdasarkan query
    const query = searchQuery.toLowerCase().trim();
    const filtered = allData.filter(item => {
      const name = item['Name'] || item['Boss Name'] || item['Miniboss Name'] || '';
      const element = item['Element'] || '';
      return name.toLowerCase().includes(query) || element.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      await sock.sendMessage(jid, {
        text: `"${searchQuery}" tidak ditemukan.`
      });
      return;
    }

    // Ambil hasil pertama
    const boss = filtered[0];
    const name = boss['Name'] || boss['Boss Name'] || boss['Miniboss Name'] || 'Unknown';

    let message = `*${name}*\n`;
    message += `Level: ${boss['Lv'] || boss['Level'] || '-'}\n`;
    message += `Element: ${boss['Element'] || '-'}\n`;
    message += `HP: ${boss['Base HP'] || boss['HP'] || '-'}\n`;
    message += `EXP: ${boss['Base EXP'] || boss['EXP'] || '-'}\n`;
    message += `DEF: ${boss['DEF'] || '-'}\n`;
    message += `MDEF: ${boss['MDEF'] || '-'}\n`;
    message += `FLEE: ${boss['FLEE'] || '-'}\n`;
    message += `Guard: ${boss['Guard %'] || '-'}\n`;
    message += `Evade: ${boss['Evade %'] || '-'}\n`;

    if (boss['Normal Proration %']) message += `Normal Proration: ${boss['Normal Proration %']}\n`;
    if (boss['Physical Proration %']) message += `Physical Proration: ${boss['Physical Proration %']}\n`;
    if (boss['Magic Proration %']) message += `Magic Proration: ${boss['Magic Proration %']}\n`;
    if (boss['Physical Resistant %']) message += `Physical Resistance: ${boss['Physical Resistant %']}\n`;
    if (boss['Magic Resistant %']) message += `Magic Resistance: ${boss['Magic Resistant %']}\n`;
    if (boss['Crit. Res']) message += `Crit Res: ${boss['Crit. Res']}\n`;

    await sock.sendMessage(jid, { text: message });

  } catch (error) {
    console.error("Error bosdef:", error);
    await sock.sendMessage(jid, {
      text: "Terjadi kesalahan: " + error.message
    });
  }
};


