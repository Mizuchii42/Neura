import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

export const screenshotFullTable = async (month = "202601") => {
  const url = `https://tanaka0.work/AIO/en/DyePredictor/ColorWeapon?month=${month}`;
  const outputDir = path.resolve("temp");
  const filePath = path.join(outputDir, `dye_${month}.png`);

  // Buat direktori jika belum ada
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

    // Set timeout lebih lama jika diperlukan
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    // Tunggu tabel muncul dengan timeout
    await page.waitForSelector("table", { timeout: 10000 });

    // Tunggu sebentar untuk memastikan rendering selesai
    await page.waitForTimeout(1000);

    // Ambil ukuran tabel
    const tableInfo = await page.evaluate(() => {
      const table = document.querySelector("table");
      if (!table) return null;

      const rect = table.getBoundingClientRect();
      return {
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
        x: Math.floor(rect.x),
        y: Math.floor(rect.y),
      };
    });

    if (!tableInfo) {
      throw new Error("Tabel tidak ditemukan di halaman");
    }

    // Set viewport dengan ukuran yang cukup
    await page.setViewport({
      width: Math.max(1200, tableInfo.width + 100),
      height: Math.max(800, tableInfo.height + 100),
      deviceScaleFactor: 2, // Untuk kualitas lebih tinggi
    });

    // Tunggu sebentar setelah resize
    await page.waitForTimeout(500);

    // Screenshot tabel
    const table = await page.$("table");
    if (!table) {
      throw new Error("Elemen tabel tidak dapat ditemukan");
    }

    await table.screenshot({
      path: filePath,
      type: "png",
    });

    console.log(`Screenshot berhasil disimpan di: ${filePath}`);
    return filePath;

  } catch (error) {
    console.error("Error saat screenshot:", error.message);
    throw error;
  } finally {
    // Pastikan browser selalu ditutup
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
