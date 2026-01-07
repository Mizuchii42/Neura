import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper untuk convert string ke number jika memungkinkan
const parseValue = (value) => {
  if (!value || value === '-' || value === '') return null;
  const num = Number(value.replace(/,/g, ''));
  return isNaN(num) ? value : num;
};

// Scrape data dari Google Sheets
const scrapeSheetData = async (url, type) => {
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

    const data = await page.evaluate((bossType) => {
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

        const item = { type: bossType };
        cells.forEach((cell, idx) => {
          const header = headers[idx];
          if (header) {
            item[header] = cell.textContent.trim();
          }
        });

        // Hanya tambahkan jika ada data
        if (Object.keys(item).length > 1) {
          list.push(item);
        }
      }

      return list;
    }, type);

    await browser.close();
    return data || [];

  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
};

// Generate JSON file dari kedua sheet
export const generateBossJSON = async () => {
  try {
    console.log("Mengambil data boss dan miniboss...");

    const [bossData, minibossData] = await Promise.all([
      scrapeSheetData(
        "https://docs.google.com/spreadsheets/d/1s_CcLFFUeyP28HaHrJtRcTh06YVujO8boa4SzWwvy-M/htmlview",
        "Boss"
      ),
      scrapeSheetData(
        "https://docs.google.com/spreadsheets/d/1FOb_YkYNuw_EUWNg5AFo5PfuuupKzeT592FZ_mazXXk/htmlview",
        "Miniboss"
      )
    ]);

    // Gabungkan dan format data
    const allData = [...bossData, ...minibossData].map((item, index) => {
      const formatted = {
        id: index + 1,
        name: item['Name'] || item['Boss Name'] || item['Miniboss Name'] || 'Unknown',
        type: item.type,
        level: parseValue(item['Lv'] || item['Level']),
        element: item['Element'] || null,
        hp: parseValue(item['Base HP'] || item['HP']),
        exp: parseValue(item['Base EXP'] || item['EXP']),
        def: parseValue(item['DEF']),
        mdef: parseValue(item['MDEF']),
        flee: parseValue(item['FLEE']),
        guard: parseValue(item['Guard %']),
        evade: parseValue(item['Evade %']),
        normal_proration: parseValue(item['Normal Proration %']),
        physical_proration: parseValue(item['Physical Proration %']),
        magic_proration: parseValue(item['Magic Proration %']),
        physical_resistance: item['Physical Resistant %'] || null,
        magic_resistance: item['Magic Resistant %'] || null,
        crit_res: item['Crit. Res'] || null
      };

      // Hapus field yang null untuk menghemat space
      Object.keys(formatted).forEach(key => {
        if (formatted[key] === null || formatted[key] === undefined) {
          delete formatted[key];
        }
      });

      return formatted;
    });

    // Save ke file JSON
    const outputDir = path.resolve("data");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, "boss-data.json");
    fs.writeFileSync(filePath, JSON.stringify(allData, null, 2), "utf-8");

    console.log(`✓ Data berhasil disimpan ke: ${filePath}`);
    console.log(`  - Total: ${allData.length} entries`);
    console.log(`  - Boss: ${bossData.length}`);
    console.log(`  - Miniboss: ${minibossData.length}`);

    return filePath;
  } catch (error) {
    console.error("Error generating JSON:", error);
    throw error;
  }
};

// Load data dari JSON file
const loadBossData = () => {
  const filePath = path.resolve("data", "boss-data.json");

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(rawData);
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

    // Load data dari JSON
    let allData = loadBossData();

    // Jika file tidak ada, scrape dulu
    if (!allData) {
      await sock.sendMessage(jid, { text: "Mengambil data pertama kali..." });
      await generateBossJSON();
      allData = loadBossData();
    }

    // Cari berdasarkan query
    const query = searchQuery.toLowerCase().trim();
    const filtered = allData.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.element && item.element.toLowerCase().includes(query)) ||
      (item.type && item.type.toLowerCase().includes(query))
    );

    if (filtered.length === 0) {
      await sock.sendMessage(jid, {
        text: `"${searchQuery}" tidak ditemukan.`
      });
      return;
    }

    // Ambil hasil pertama
    const boss = filtered[0];

    let message = `*${boss.name}* (${boss.type})\n\n`;
    message += `Level: ${boss.level || '-'}\n`;
    message += `Element: ${boss.element || '-'}\n`;
    message += `HP: ${boss.hp ? boss.hp.toLocaleString() : '-'}\n`;
    message += `EXP: ${boss.exp ? boss.exp.toLocaleString() : '-'}\n`;
    message += `DEF: ${boss.def || '-'}\n`;
    message += `MDEF: ${boss.mdef || '-'}\n`;
    message += `FLEE: ${boss.flee || '-'}\n`;
    message += `Guard: ${boss.guard || '-'}%\n`;
    message += `Evade: ${boss.evade || '-'}%\n`;

    if (boss.normal_proration) message += `Normal Proration: ${boss.normal_proration}%\n`;
    if (boss.physical_proration) message += `Physical Proration: ${boss.physical_proration}%\n`;
    if (boss.magic_proration) message += `Magic Proration: ${boss.magic_proration}%\n`;
    if (boss.physical_resistance) message += `Physical Resistance: ${boss.physical_resistance}\n`;
    if (boss.magic_resistance) message += `Magic Resistance: ${boss.magic_resistance}\n`;
    if (boss.crit_res) message += `Crit Res: ${boss.crit_res}\n`;

    // Jika ada lebih dari 1 hasil
    if (filtered.length > 1) {
      const others = filtered.slice(1).map(i => `${i.name} (${i.type})`).join(', ');
      message += `\nDitemukan ${filtered.length} hasil. Lainnya: ${others}`;
    }

    await sock.sendMessage(jid, { text: message });

  } catch (error) {
    console.error("Error bosdef:", error);
    await sock.sendMessage(jid, {
      text: "Terjadi kesalahan: " + error.message
    });
  }
};


