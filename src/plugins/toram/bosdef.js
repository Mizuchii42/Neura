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
      if (!table) return null;

      const rows = table.querySelectorAll("tr");
      if (rows.length === 0) return null;

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
          const header = headers[idx] || `col${idx}`;
          item[header] = cell.textContent.trim();
        });

        if (Object.values(item).some(v => v)) {
          list.push(item);
        }
      }

      return {
        headers,
        list,
        total: list.length
      };
    });

    await browser.close();
    return data;

  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
};

// Ambil data boss dan miniboss
export const getBossData = async () => {
  try {
    const [bossData, minibossData] = await Promise.all([
      scrapeSheetData("https://docs.google.com/spreadsheets/d/1s_CcLFFUeyP28HaHrJtRcTh06YVujO8boa4SzWwvy-M/htmlview"),
      scrapeSheetData("https://docs.google.com/spreadsheets/d/1FOb_YkYNuw_EUWNg5AFo5PfuuupKzeT592FZ_mazXXk/htmlview")
    ]);

    return {
      boss: bossData?.list || [],
      miniboss: minibossData?.list || [],
      total: (bossData?.total || 0) + (minibossData?.total || 0)
    };
  } catch (error) {
    console.error("Error fetching boss data:", error);
    throw error;
  }
};

// Format data untuk ditampilkan di WhatsApp
export const formatBossMessage = (data, searchQuery = null) => {
  if (!data || (data.boss.length === 0 && data.miniboss.length === 0)) {
    return "Data tidak ditemukan.";
  }

  if (!searchQuery) {
    return "Silakan masukkan nama boss/miniboss yang ingin dicari.\n\nContoh: !bosdef venena";
  }

  const query = searchQuery.toLowerCase();

  // Gabungkan semua data dan tambahkan type
  const allData = [
    ...data.boss.map(b => ({ ...b, type: 'Boss' })),
    ...data.miniboss.map(m => ({ ...m, type: 'Miniboss' }))
  ];

  // Filter berdasarkan search query
  const filtered = allData.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(query)
    )
  );

  if (filtered.length === 0) {
    return `"${searchQuery}" tidak ditemukan.`;
  }

  // Ambil item pertama yang cocok
  const item = filtered[0];
  const name = item['Boss Name'] || item['Nama Boss'] || item['Miniboss Name'] || item['Nama Miniboss'] || 'Unknown';

  let message = `*${name}* (${item.type})\n\n`;

  // Tampilkan semua field
  Object.entries(item).forEach(([key, value]) => {
    if (key !== 'Boss Name' && key !== 'Nama Boss' &&
      key !== 'Miniboss Name' && key !== 'Nama Miniboss' &&
      key !== 'type') {
      const displayValue = value || '-';
      message += `${key}: ${displayValue}\n`;
    }
  });

  // Jika ada lebih dari 1 hasil
  if (filtered.length > 1) {
    const others = filtered.slice(1).map(i => {
      const n = i['Boss Name'] || i['Nama Boss'] || i['Miniboss Name'] || i['Nama Miniboss'];
      return `${n} (${i.type})`;
    }).join(', ');
    message += `\nDitemukan ${filtered.length} hasil. Lainnya: ${others}`;
  }

  return message;
};

// Fungsi untuk bot Baileys
export const handleBossCommand = async (sock, msg, text) => {
  const jid = msg.key.remoteJid;
  const args = text.split("|");


  try {
    await sock.sendMessage(jid, {
      text: "Mengambil data..."
    });

    const data = await getBossData();
    const searchQuery = args[1];
    const message = formatBossMessage(data, searchQuery || null);

    await sock.sendMessage(jid, { text: message });

  } catch (error) {
    console.error("Error getting boss data:", error);
    await sock.sendMessage(jid, {
      text: "Terjadi kesalahan saat mengambil data."
    });
  }
};

