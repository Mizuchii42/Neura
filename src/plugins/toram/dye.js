import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

// Helper function untuk delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const screenshotFullTable = async (month = "202601") => {
  const url = `https://tanaka0.work/AIO/en/DyePredictor/ColorWeapon?month=${month}`;
  const outputDir = path.resolve("temp");
  const filePath = path.join(outputDir, `dye_${month}_full.png`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

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

    // Tunggu tabel muncul
    await page.waitForSelector("table", { timeout: 10000 });
    await delay(1500);

    // Cari container yang berisi semua tabel atau body
    const containerInfo = await page.evaluate(() => {
      const tables = document.querySelectorAll("table");

      if (tables.length === 0) return null;

      // Coba cari parent container yang berisi semua tabel
      let container = tables[0].parentElement;

      // Cek apakah semua tabel ada dalam container ini
      while (container && container !== document.body) {
        const tablesInContainer = container.querySelectorAll("table");
        if (tablesInContainer.length === tables.length) {
          break;
        }
        container = container.parentElement;
      }

      // Jika tidak ada container yang pas, gunakan body
      if (!container || container === document.body) {
        // Hitung dari tabel pertama sampai terakhir
        const firstTable = tables[0];
        const lastTable = tables[tables.length - 1];

        const firstRect = firstTable.getBoundingClientRect();
        const lastRect = lastTable.getBoundingClientRect();

        return {
          x: Math.floor(Math.min(firstRect.x, lastRect.x)),
          y: Math.floor(firstRect.y),
          width: Math.ceil(Math.max(firstRect.width, lastRect.width)),
          height: Math.ceil((lastRect.bottom - firstRect.top)),
          tableCount: tables.length,
          useClip: true
        };
      }

      const rect = container.getBoundingClientRect();
      return {
        x: Math.floor(rect.x),
        y: Math.floor(rect.y),
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
        tableCount: tables.length,
        useClip: false,
        element: container.tagName
      };
    });

    if (!containerInfo) {
      throw new Error("Tabel tidak ditemukan di halaman");
    }

    console.log(`Ditemukan ${containerInfo.tableCount} tabel`);
    console.log(`Ukuran area: ${containerInfo.width}x${containerInfo.height}px`);

    // Set viewport dengan ukuran yang cukup besar
    await page.setViewport({
      width: Math.max(1400, containerInfo.width + 100),
      height: Math.max(1000, containerInfo.height + 200),
      deviceScaleFactor: 1, // Gunakan 1 untuk file size lebih kecil, 2 untuk quality lebih tinggi
    });

    await delay(1000);

    if (containerInfo.useClip) {
      // Screenshot dengan clip untuk area spesifik
      await page.screenshot({
        path: filePath,
        type: "png",
        clip: {
          x: Math.max(0, containerInfo.x - 10),
          y: Math.max(0, containerInfo.y - 10),
          width: containerInfo.width + 20,
          height: containerInfo.height + 20,
        }
      });
    } else {
      // Screenshot container element
      const container = await page.evaluateHandle(() => {
        const tables = document.querySelectorAll("table");
        let container = tables[0].parentElement;

        while (container && container !== document.body) {
          const tablesInContainer = container.querySelectorAll("table");
          if (tablesInContainer.length === tables.length) {
            return container;
          }
          container = container.parentElement;
        }
        return document.body;
      });

      await container.screenshot({
        path: filePath,
        type: "png",
      });
    }

    console.log(`✓ Screenshot FULL (${containerInfo.tableCount} tabel) berhasil disimpan di: ${filePath}`);
    return filePath;

  } catch (error) {
    console.error("Error saat screenshot:", error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};




export const dyePredictor = async (sock, chatId, msg, text) => {
  try {
    const month = text?.split(" ")[1] || "202601";

    await sock.sendMessage(
      chatId,
      { text: "Mengambil data dye weapon, mohon tunggu..." },
      { quoted: msg }
    );

    const imgPath = await screenshotFullTable(month);
    const buffer = fs.readFileSync(imgPath);

    await sock.sendMessage(
      chatId,
      {
        image: buffer,
        caption: `Dye Weapon Prediction\nMonth: ${month}`,
      },
      { quoted: msg }
    );

    fs.unlinkSync(imgPath); // hapus file setelah dikirim
  } catch (err) {
    console.error(err);
    sock.sendMessage(chatId, { text: err }, { quoted: msg });
  }
};
