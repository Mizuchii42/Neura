import axios from "axios";
import * as cheerio from "cheerio";
import { URLSearchParams } from "url";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import readline from "readline";

// Enable stealth plugin
puppeteer.use(StealthPlugin());




// --- CONFIGURATION ---
const CONFIG = {
  MAX_RETRIES: 3,
  DEFAULT_TIMEOUT: 120000,
  CHECK_INTERVAL: 2000,
  DEFAULT_LEVEL: 280,
  DEFAULT_POTENTIAL: 110,
  BASE_URL: "https://tanaka0.work/id/BouguProper",
};

const statMap = {
  // Critical Stats
  critdmg: "Critical Damage",
  "critdmg%": "Critical Damage %",
  critrate: "Critical Rate",
  "critrate%": "Critical Rate %",

  // Attack Stats
  atk: "ATK",
  "atk%": "ATK %",
  matk: "MATK",
  "matk%": "MATK %",

  // Defense Stats
  def: "DEF",
  "def%": "DEF %",
  mdef: "MDEF",
  "mdef%": "MDEF %",

  // Accuracy Stats
  acc: "Accuracy",
  accuracy: "Accuracy",
  "acc%": "Accuracy %",
  "accuracy%": "Accuracy %",

  // HP/MP Stats
  hp: "MaxHP",
  "hp%": "MaxHP %",
  mp: "MaxMP",
  "mp%": "MaxMP %",

  // Status Stats
  str: "STR",
  "str%": "STR %",
  int: "INT",
  "int%": "INT %",
  vit: "VIT",
  "vit%": "VIT %",
  agi: "AGI",
  "agi%": "AGI %",
  dex: "DEX",
  "dex%": "DEX %",

  // Speed Stats
  aspd: "Kecepatan Serangan",
  "aspd%": "Kecepatan Serangan %",
  cspd: "Kecepatan Merapal",
  "cspd%": "Kecepatan Merapal %",

  // Dodge Stats
  dodge: "Dodge",
  "dodge%": "Dodge %",

  // Regen Stats
  hpreg: "Natural HP Regen",
  "hpreg%": "Natural HP Regen %",
  mpreg: "Natural MP Regen",
  "mpreg%": "Natural MP Regen %",

  // Special Stats
  "stab%": "Stability %",
  "penfis%": "Penetrasi Fisik %",
  "penmag%": "Magic Pierce %",
  "kebalfis%": "Kekebalan Fisik %",
  "kebalmag%": "Kekebalan Sihir %",
  "aggro%": "Aggro %",

  "dteearth%": "% luka ke Bumi",
  //dteearth: "% Luka ke Bumi",
  "dtefire%": "% luka ke Api",
  //dtefire: "% Luka ke Api",
  "dtewind%": "% luka ke Angin",
  "dtewater%": "% luka ke Air",
  "dtelight%": "% luka ke Cahaya",
  "dtedark%": "% luka ke Gelap",
  dteearth: "% luka ke Bumi",
  dtefire: "% luka ke Api",
  dtewind: "% luka ke Angin",
  dtewater: "% luka ke Air",
  dtelight: "% luka ke Cahaya",
  dtedark: "% luka ke Gelap",
};

// --- ENHANCEMENT INFO DATA ---
const enhancementInfo = {
  "Critical Damage": {
    maxLevel: 22,
    potentialCost: 3,
    category: "Critical",
    returnValue: 19,
  },
  "Critical Damage %": {
    maxLevel: 11,
    potentialCost: 10,
    category: "Critical",
    returnValue: 32,
  },
  ATK: {
    maxLevel: 28,
    potentialCost: 6,
    category: "Attack",
    returnValue: 43,
  },
  "ATK %": {
    maxLevel: 14,
    potentialCost: 20,
    category: "Attack",
    returnValue: 73,
  },
  MATK: {
    maxLevel: 28,
    potentialCost: 6,
    category: "Attack",
    returnValue: 43,
  },
  "MATK %": {
    maxLevel: 14,
    potentialCost: 20,
    category: "Attack",
    returnValue: 73,
  },
  DEF: {
    maxLevel: 28,
    potentialCost: 3,
    category: "Defense",
    returnValue: 21,
  },
  "DEF %": {
    maxLevel: 12,
    potentialCost: 10,
    category: "Defense",
    returnValue: 33,
  },
  MDEF: {
    maxLevel: 28,
    potentialCost: 3,
    category: "Defense",
    returnValue: 21,
  },
  "MDEF %": {
    maxLevel: 12,
    potentialCost: 10,
    category: "Defense",
    returnValue: 33,
  },
  Accuracy: {
    maxLevel: 15,
    potentialCost: 20,
    category: "Accuracy",
    returnValue: 76,
  },
  "Accuracy %": {
    maxLevel: 6,
    potentialCost: 40,
    category: "Accuracy",
    returnValue: 67,
  },
};

// --- UTILITY FUNCTIONS ---
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function waitForEnter(message = "Press Enter to continue...") {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(message, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

async function withRetry(fn, retries = CONFIG.MAX_RETRIES, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`❗ Percobaan ${i + 1} gagal:`, error.message);
      if (i === retries - 1) throw error;
      await sleep(delay);
      delay *= 1.5; // Gradual backoff
    }
  }
}

// --- COMMAND PARSING ---
function parseCommand(args) {
  const config = {
    positiveStats: [],
    negativeStats: [],
    characterLevel: CONFIG.DEFAULT_LEVEL,
    startingPotential: CONFIG.DEFAULT_POTENTIAL,
  };

  args.forEach((arg) => {
    arg = arg.toLowerCase();

    if (arg.startsWith("lv")) {
      const level = parseInt(arg.substring(2), 10);
      if (!isNaN(level) && level >= 1 && level <= 500) {
        config.characterLevel = level;
      }
    } else if (arg.startsWith("pot")) {
      const potential = parseInt(arg.substring(3), 10);
      if (!isNaN(potential) && potential >= 0 && potential <= 200) {
        config.startingPotential = potential;
      }
    } else if (arg.startsWith("+") || arg.startsWith("-")) {
      const isPositive = arg.startsWith("+");
      const rawStat = arg.substring(1);
      const match = rawStat.match(/^(.*?)(\d+|max)$/);

      if (!match) {
        console.warn(`⚠️ Format stat tidak valid: ${arg}, diabaikan`);
        return;
      }

      const [, name, level] = match;
      const fullName = statMap[name];

      if (!fullName) {
        console.warn(`⚠️ Stat tidak dikenal: ${name}, diabaikan`);
        console.warn(`📝 Stat yang tersedia: ${Object.keys(statMap).join(", ")}`);
        return;
      }

      const statObject = { name: fullName, level: level.toUpperCase() };

      if (isPositive) {
        if (config.positiveStats.length < 7) {
          config.positiveStats.push(statObject);
          console.log(`✓ Positive stat ditambahkan: ${fullName} ${level.toUpperCase()}`);
        } else {
          console.warn(`⚠️ Maksimal 7 positive stats, ${fullName} diabaikan`);
        }
      } else {
        if (config.negativeStats.length < 7) {
          config.negativeStats.push(statObject);
          console.log(`✓ Negative stat ditambahkan: ${fullName} ${level.toUpperCase()}`);
        } else {
          console.warn(`⚠️ Maksimal 7 negative stats, ${fullName} diabaikan`);
        }
      }
    }
  });

  console.log(`\n📊 Konfigurasi Final:`);
  console.log(`- Level: ${config.characterLevel}`);
  console.log(`- Starting Potential: ${config.startingPotential}`);
  console.log(
    `- Positive Stats (${config.positiveStats.length}/7):`,
    config.positiveStats.map((s) => `${s.name} ${s.level}`).join(", ") || "Tidak ada"
  );
  console.log(
    `- Negative Stats (${config.negativeStats.length}/7):`,
    config.negativeStats.map((s) => `${s.name} ${s.level}`).join(", ") || "Tidak ada"
  );

  return config;
}

// --- CAPTCHA HANDLING ---
async function handleCaptcha(page) {
  try {
    console.log("🔍 Menganalisis CAPTCHA...");

    // Method 1: Wait for auto-disappearing CAPTCHA
    for (let i = 0; i < 30; i++) {
      await sleep(1000);

      const captchaGone = await page.evaluate(() => {
        const captchaElements = document.querySelectorAll(
          '[id*="captcha"], [class*="captcha"], .captcha'
        );
        const pageText = document.body.innerText.toLowerCase();

        return (
          captchaElements.length === 0 ||
          Array.from(captchaElements).every((el) => el.style.display === "none") ||
          (!pageText.includes("captcha") && !pageText.includes("verify"))
        );
      });

      if (captchaGone) {
        console.log("✅ CAPTCHA hilang otomatis!");
        return { solved: true, method: "auto-disappeared" };
      }

      process.stdout.write(`\r🔒 Menunggu CAPTCHA ${i + 1}/30...`);
    }

    // Method 2: Try automated clicking
    console.log("\n🖱️ Mencoba penyelesaian otomatis...");

    const clickResult = await page.evaluate(() => {
      // Common CAPTCHA selectors
      const selectors = [
        'input[type="checkbox"]',
        'button[type="submit"]',
        ".recaptcha-checkbox",
        '[role="checkbox"]',
        'button:contains("Verify")',
        'button:contains("Continue")',
        'button:contains("Submit")',
      ];

      for (let selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          for (let element of elements) {
            const text = element.textContent?.toLowerCase() || "";
            const parentText = element.parentElement?.textContent?.toLowerCase() || "";

            if (
              text.includes("robot") ||
              text.includes("human") ||
              text.includes("verify") ||
              text.includes("continue") ||
              parentText.includes("robot") ||
              parentText.includes("human")
            ) {
              element.click();
              return { clicked: true, type: selector, text: text || parentText };
            }
          }
        } catch (e) {
          continue;
        }
      }
      return { clicked: false };
    });

    if (clickResult.clicked) {
      console.log(`✅ Diklik: ${clickResult.type} - "${clickResult.text}"`);

      // Wait for processing
      await sleep(5000);

      const solved = await page.evaluate(() => {
        const pageText = document.body.innerText.toLowerCase();
        return !pageText.includes("captcha") && !pageText.includes("verify");
      });

      if (solved) {
        return { solved: true, method: "auto-click" };
      }
    }

    console.log("🔧 CAPTCHA memerlukan penanganan manual");
    return { solved: false, requiresManual: true };
  } catch (error) {
    console.log(`\n❌ Error menangani CAPTCHA: ${error.message}`);
    return { solved: false, error: error.message };
  }
}

// --- AUTO WAIT FOR RESULTS ---
async function autoWaitForResults(page, maxWaitTime, checkInterval) {
  console.log("🤖 Memulai pemantauan otomatis...");

  const startTime = Date.now();
  let captchaDetected = false;

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const pageState = await page.evaluate(() => {
        const pageText = document.body.innerText.toLowerCase();

        return {
          hasCaptcha:
            pageText.includes("captcha") ||
            pageText.includes("verify") ||
            pageText.includes("robot") ||
            document.querySelector(".captcha") ||
            document.querySelector('[id*="captcha"]'),
          isLoading:
            pageText.includes("loading") ||
            pageText.includes("please wait") ||
            pageText.includes("processing"),
          hasResults: pageText.includes("success rate") && pageText.includes("statting of armor"),
          hasError:
            pageText.includes("error") ||
            pageText.includes("failed") ||
            pageText.includes("timeout"),
          pageText: document.body.innerText.substring(0, 1000),
        };
      });

      // Handle CAPTCHA
      if (pageState.hasCaptcha && !captchaDetected) {
        captchaDetected = true;
        console.log("🔒 CAPTCHA terdeteksi!");

        const captchaResult = await handleCaptcha(page);
        if (captchaResult.solved) {
          console.log("✅ CAPTCHA berhasil diselesaikan!");
        } else if (captchaResult.requiresManual) {
          throw new Error("CAPTCHA_MANUAL_REQUIRED");
        }
      }

      // Check for results
      if (pageState.hasResults) {
        console.log("🎯 Hasil ditemukan! Memulai parsing...");
        return await parseAllResults(page);
      }

      // Handle errors
      if (pageState.hasError) {
        console.log("❌ Error terdeteksi pada halaman");
        return {
          error: "Terjadi error pada website",
          pageContent: pageState.pageText.substring(0, 500),
          hasValidResult: false,
        };
      }

      // Show progress
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const remaining = Math.round((maxWaitTime - (Date.now() - startTime)) / 1000);

      if (pageState.isLoading) {
        process.stdout.write(`\r⏳ Memproses... ${elapsed}s (${remaining}s tersisa)`);
      } else {
        process.stdout.write(`\r🔄 Menunggu hasil... ${elapsed}s (${remaining}s tersisa)`);
      }

      await sleep(checkInterval);
    } catch (error) {
      if (error.message === "CAPTCHA_MANUAL_REQUIRED") {
        throw error;
      }
      console.log(`\nError saat monitoring: ${error.message}`);
      await sleep(checkInterval);
    }
  }

  console.log("\nTimeout tercapai, mencoba parsing terakhir...");
  return await parseAllResults(page);
}

// --- RESULT PARSING ---
// Updated parseAllResults function - Material Cost section
// Updated parseAllResults function - Material Cost section
async function parseAllResults(page) {
  console.log("\n Parsing hasil dari halaman...");

  const allData = await page.evaluate(() => {
    const divs = document.querySelectorAll("div");
    const resultDivs = [];

    Array.from(divs).forEach((div, index) => {
      const text = div.innerText?.trim() || "";
      const html = div.innerHTML?.trim() || "";

      if (text.length > 20) {
        resultDivs.push({
          index,
          text,
          html,
          hasSuccessRate: text.includes("Success Rate"),
          hasStatting: text.includes("Statting of Armor"),
          hasSteps: /\d+\.\s/.test(text),
          isCostInfo:
            text.includes("Mat cost") || text.includes("Medicine") || text.includes("Mana:"),
          isWarning: text.includes("Perhatian") || text.includes("***"),
        });
      }
    });

    return {
      resultDivs,
      pageText: document.body.innerText,
    };
  });

  console.log(` Ditemukan ${allData.resultDivs.length} div dengan konten`);

  const result = {
    finalStat: "Tidak ditemukan",
    successRate: "Tidak ditemukan",
    startingPot: "Tidak ditemukan",
    steps: [],
    materialCost: "Tidak ditemukan",
    materialDetails: {},
    highestStepCost: "Tidak ditemukan",
    warnings: [],
    timestamp: new Date().toISOString(),
    totalSteps: 0,
    hasValidResult: false,
  };

  // Process each div
  allData.resultDivs.forEach((div) => {
    const text = div.text;
    const html = div.html;

    // Extract final stats
    if (div.hasStatting && text.includes("Result")) {
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);
      const statLines = lines.filter(
        (l) =>
          l.includes("Critical Damage") ||
          l.includes("Accuracy") ||
          l.includes("ATK") ||
          l.includes("MATK") ||
          l.includes("DEF")
      );

      if (statLines.length > 0) {
        result.finalStat = statLines.join(", ");
        console.log("✓ Final stat ditemukan:", result.finalStat);
      }
    }

    // Extract success rate and related info
    if (div.hasSuccessRate) {
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);

      const successLine = lines.find((l) => l.includes("Success Rate"));
      if (successLine) {
        result.successRate = successLine;
        console.log("✓ Success rate ditemukan:", result.successRate);
      }

      const potMatch = text.match(/Starting Pot[：:]\s*(\d+pt)/);
      if (potMatch) {
        result.startingPot = potMatch[0];
        console.log("✓ Starting pot ditemukan:", result.startingPot);
      }

      const steps = lines.filter((l) => /^\d+\.\s/.test(l));
      if (steps.length > 0) {
        result.steps = steps;
        console.log(`✓ ${steps.length} langkah ditemukan`);
      }
    }

    // Enhanced material cost extraction
    if (div.isCostInfo) {
      // Extract detailed material breakdown
      const materialMatches = {
        metal: text.match(/Metal:(\d+(?:,\d+)*)pt/),
        cloth: text.match(/Cloth:(\d+(?:,\d+)*)pt/),
        beast: text.match(/Beast:(\d+(?:,\d+)*)pt/),
        wood: text.match(/Wood:(\d+(?:,\d+)*)pt/),
        medicine: text.match(/Medicine:(\d+(?:,\d+)*)pt/),
        mana: text.match(/Mana:(\d+(?:,\d+)*)pt/),
      };

      // Store individual materials
      const materials = [];
      Object.entries(materialMatches).forEach(([key, match]) => {
        if (match && match[1] !== "0") {
          result.materialDetails[key] = match[1];
          materials.push(`${key.charAt(0).toUpperCase() + key.slice(1)}:${match[1]}pt`);
        }
      });

      if (materials.length > 0) {
        result.materialCost = materials.join(", ");
        console.log("✓ Material cost ditemukan:", result.materialCost);
      }

      // Extract highest step cost
      const highestMatch = text.match(
        /Highest mats per step[：:]?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*pt/i
      );
      if (highestMatch) {
        result.highestStepCost = `${highestMatch[1]}pt`;
        console.log("✓ Highest step cost ditemukan:", result.highestStepCost);
      }

      // Extract reduction info
      const reductionMatch = text.match(/\((\d+%)\s*reduction\s*by\s*(\w+)\)/i);
      if (reductionMatch) {
        result.materialDetails.reduction = `${reductionMatch[1]} by ${reductionMatch[2]}`;
      }

      // Extract material type percentages
      const percentageMatch = text.match(/\(([^)]*Metal:\d+%[^)]*)\)/);
      if (percentageMatch) {
        result.materialDetails.breakdown = percentageMatch[1];
      }
    }

    // Extract warnings
    if (div.isWarning) {
      result.warnings.push(text.substring(0, 200) + (text.length > 200 ? "..." : ""));
    }
  });

  result.totalSteps = result.steps.length;
  result.hasValidResult =
    result.finalStat !== "Tidak ditemukan" && result.successRate !== "Tidak ditemukan";

  console.log("\nRingkasan hasil:");
  console.log(`- Material cost: ${result.materialCost}`);
  console.log(`- Highest step cost: ${result.highestStepCost}`);
  console.log(`- Success Rate: ${result.successRate}`);
  console.log(`- Starting Pot: ${result.startingPot}`);
  console.log(`- Total Steps: ${result.totalSteps}`);
  console.log(`- Valid Result: ${result.hasValidResult}`);

  return result;
}

// Updated message formatting function
function formatResultMessage(result) {
  if (result.error) {
    return `*Error Tanaka Scraper:*\n${result.error}`;
  }

  if (!result.hasValidResult) {
    return `*Tanaka Scraper:*\nHasil tidak lengkap atau gagal memuat`;
  }

  let message = `*Hasil Tanaka*\n\n`;
  message += `*Success Rate:* ${result.successRate}\n`;
  message += `*Starting Pot:* ${result.startingPot}\n`;
  message += `*Total Steps:* ${result.totalSteps}\n`;

  if (result.materialCost !== "Tidak ditemukan") {
    message += `*Material Cost:* ${result.materialCost}\n`;
  }

  if (result.highestStepCost !== "Tidak ditemukan") {
    message += `*Highest Step Cost:* ${result.highestStepCost}\n`;
  }

  // Add material breakdown if available
  if (result.materialDetails.breakdown) {
    message += `*Material Breakdown:* ${result.materialDetails.breakdown}\n`;
  }

  if (result.materialDetails.reduction) {
    message += ` *Cost Reduction:* ${result.materialDetails.reduction}\n`;
  }

  if (result.steps.length > 0) {
    message += `\n*Langkah Enhancement:*\n`;
    result.steps.slice(0, 5).forEach((step) => {
      message += `${step}\n`;
    });
    if (result.steps.length > 5) {
      message += `... dan ${result.steps.length - 5} langkah lainnya\n`;
    }
  }

  if (result.duration) {
    message += `\n*Waktu Eksekusi:* ${Math.round(result.duration / 1000)}s`;
  }

  message += `\n*Dibuat:* ${new Date(result.timestamp).toLocaleString("id-ID")}`;

  return message;
}

// Updated message formatting function
// function formatResultMessage(message) {
// 	if (result.error) {
// 		return `❌ *Error Tanaka Scraper:*\n${result.error}`;
// 	}

// 	if (!result.hasValidResult) {
// 		return `⚠️ *Tanaka Scraper:*\nHasil tidak lengkap atau gagal memuat`;
// 	}

// 	let message = `🎯 *Hasil Enhancement Tanaka*\n\n`;
// 	message += `📈 *Success Rate:* ${result.successRate}\n`;
// 	message += `💰 *Starting Pot:* ${result.startingPot}\n`;
// 	message += `🔢 *Total Steps:* ${result.totalSteps}\n`;

// 	if (result.materialCost !== "Tidak ditemukan") {
// 		message += `💎 *Material Cost:* ${result.materialCost}\n`;
// 	}

// 	if (result.highestStepCost !== "Tidak ditemukan") {
// 		message += `⚡ *Highest Step Cost:* ${result.highestStepCost}\n`;
// 	}

// 	// Add material breakdown if available
// 	if (result.materialDetails.breakdown) {
// 		message += `📊 *Material Breakdown:* ${result.materialDetails.breakdown}\n`;
// 	}

// 	if (result.materialDetails.reduction) {
// 		message += `🔧 *Cost Reduction:* ${result.materialDetails.reduction}\n`;
// 	}

// 	if (result.steps.length > 0) {
// 		message += `\n📋 *Langkah Enhancement:*\n`;
// 		result.steps.slice(0, 5).forEach((step) => {
// 			message += `${step}\n`;
// 		});
// 		if (result.steps.length > 5) {
// 			message += `... dan ${result.steps.length - 5} langkah lainnya\n`;
// 		}
// 	}

// 	if (result.duration) {
// 		message += `\n⏱️ *Waktu Eksekusi:* ${Math.round(result.duration / 1000)}s`;
// 	}

// 	message += `\n⏰ *Dibuat:* ${new Date(result.timestamp).toLocaleString("id-ID")}`;

// 	return message;
// }

// 	console.log(`🔍 Ditemukan ${allData.resultDivs.length} div dengan konten`);

// 	const result = {
// 		finalStat: "Tidak ditemukan",
// 		successRate: "Tidak ditemukan",
// 		startingPot: "Tidak ditemukan",
// 		steps: [],
// 		materialCost: "Tidak ditemukan",
// 		warnings: [],
// 		timestamp: new Date().toISOString(),
// 		totalSteps: 0,
// 		hasValidResult: false,
// 	};

// 	// Process each div
// 	allData.resultDivs.forEach((div) => {
// 		const text = div.text;

// 		// Extract final stats
// 		if (div.hasStatting && text.includes("Result")) {
// 			const lines = text
// 				.split("\n")
// 				.map((l) => l.trim())
// 				.filter((l) => l);
// 			const statLines = lines.filter(
// 				(l) =>
// 					l.includes("Critical Damage") ||
// 					l.includes("Accuracy") ||
// 					l.includes("ATK") ||
// 					l.includes("MATK") ||
// 					l.includes("DEF")
// 			);

// 			if (statLines.length > 0) {
// 				result.finalStat = statLines.join(", ");
// 				console.log("✓ Final stat ditemukan:", result.finalStat);
// 			}
// 		}

// 		// Extract success rate and related info
// 		if (div.hasSuccessRate) {
// 			const lines = text
// 				.split("\n")
// 				.map((l) => l.trim())
// 				.filter((l) => l);

// 			const successLine = lines.find((l) => l.includes("Success Rate"));
// 			if (successLine) {
// 				result.successRate = successLine;
// 				console.log("✓ Success rate ditemukan:", result.successRate);
// 			}

// 			const potMatch = text.match(/Starting Pot[：:]\s*(\d+pt)/);
// 			if (potMatch) {
// 				result.startingPot = potMatch[0];
// 				console.log("✓ Starting pot ditemukan:", result.startingPot);
// 			}

// 			const steps = lines.filter((l) => /^\d+\.\s/.test(l));
// 			if (steps.length > 0) {
// 				result.steps = steps;
// 				console.log(`✓ ${steps.length} langkah ditemukan`);
// 			}
// 		}

// 		// Extract material cost
// 		if (div.isCostInfo) {
// 			const medicineMatch = text.match(/Medicine:[\d,]+pt/);
// 			const manaMatch = text.match(/Mana:[\d,]+/);
// 			if (medicineMatch || manaMatch) {
// 				result.materialCost = `${medicineMatch?.[0] || ""} ${manaMatch?.[0] || ""}`.trim();
// 				console.log("✓ Material cost ditemukan:", result.materialCost);
// 			}
// 		}

// 		// Extract warnings
// 		if (div.isWarning) {
// 			result.warnings.push(text.substring(0, 200) + (text.length > 200 ? "..." : ""));
// 		}
// 	});

// 	result.totalSteps = result.steps.length;
// 	result.hasValidResult =
// 		result.finalStat !== "Tidak ditemukan" && result.successRate !== "Tidak ditemukan";

// 	console.log("\n📊 Ringkasan hasil:");
// 	console.log(`- Matrial cost: ${result.materialCost}`);
// 	console.log(`- Success Rate: ${result.successRate}`);
// 	console.log(`- Starting Pot: ${result.startingPot}`);
// 	console.log(`- Total Steps: ${result.totalSteps}`);
// 	console.log(`- Valid Result: ${result.hasValidResult}`);

// 	return result;
// }

// --- MAIN TANAKA FUNCTION ---
export async function tanaka(statConfigOrSocket, jidOrOptions = {}, additionalOptions = {}) {
  // Handle different parameter combinations for backward compatibility
  let sock, jid, statConfig, options;

  // If first param looks like socket object (has sendMessage method)
  if (statConfigOrSocket && typeof statConfigOrSocket.sendMessage === "function") {
    sock = statConfigOrSocket;
    jid = jidOrOptions;
    options = additionalOptions;
    // Use default config for backward compatibility
    statConfig = {
      positiveStats: [{ name: "Critical Damage", level: "MAX" }],
      negativeStats: [{ name: "Accuracy", level: "MAX" }],
      characterLevel: CONFIG.DEFAULT_LEVEL,
      startingPotential: CONFIG.DEFAULT_POTENTIAL,
    };
  } else {
    // New usage: tanaka(statConfig, options)
    statConfig = statConfigOrSocket;
    options = jidOrOptions;
  }

  const {
    maxWaitTime = CONFIG.DEFAULT_TIMEOUT,
    checkInterval = CONFIG.CHECK_INTERVAL,
    headless = true,
    debug = false,
    enableRetry = true,
  } = options || {};

  const startTime = Date.now();

  const scraperFunction = async () => {
    let browser;

    try {
      console.log(" Meluncurkan peramban...");
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-software-rasterizer"
        ],
        ...(debug && { devtools: true, slowMo: 250 }),
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      console.log(`Membuka ${CONFIG.BASE_URL}...`);
      await page.goto(CONFIG.BASE_URL, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      console.log("Mengisi formulir...");
      await page.waitForSelector("#paramLevel", { timeout: 10000 });

      const { positiveStats, negativeStats, startingPotential, characterLevel } = statConfig;

      // Fill form
      await page.select("#paramLevel", String(characterLevel));

      // Fill positive stats
      for (let i = 0; i < 7; i++) {
        const stat = positiveStats[i];
        if (stat) {
          await page.select(`#plus_name_${i}`, stat.name);
          await page.select(`#plus_value_${i}`, String(stat.level));
        } else {
          await page.select(`#plus_name_${i}`, "");
        }
      }

      // Fill negative stats
      for (let i = 0; i < 7; i++) {
        const stat = negativeStats[i];
        if (stat) {
          await page.select(`#minus_name_${i}`, stat.name);
          await page.select(`#minus_value_${i}`, String(stat.level));
        } else {
          await page.select(`#minus_name_${i}`, "");
        }
      }

      // Set starting potential
      await page.evaluate((pot) => {
        const input = document.querySelector("#shokiSenzai");
        if (input) {
          input.value = pot;
          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }, String(startingPotential));

      console.log("Mengirim formulir...");
      await page.click("#sendData");
      console.log("Formulir dikirim, memulai pemantauan otomatis...");

      // Auto-detect and wait for results
      const result = await autoWaitForResults(page, maxWaitTime, checkInterval);

      // Add duration info
      result.duration = Date.now() - startTime;

      console.log("\n--- HASIL AKHIR --- 🎉");
      console.log(JSON.stringify(result, null, 2));

      // Send via socket if provided (backward compatibility)
      if (sock && jid && result.hasValidResult) {
        try {
          const message = formatResultMessage(result);
          await sock.sendMessage(jid, { text: message });
          console.log(" Hasil dikirim via WhatsApp");
        } catch (sendError) {
          console.log(" Gagal mengirim ke WhatsApp:", sendError.message);
        }
      }

      return result;
    } finally {
      if (browser) {
        console.log("\n🚪 Menutup peramban...");
        await browser.close();
      }
    }
  };

  try {
    if (enableRetry) {
      return await withRetry(scraperFunction);
    } else {
      return await scraperFunction();
    }
  } catch (error) {
    console.error("\n--- TERJADI KESALAHAN --- ❌");
    console.error("Detail error:", error.message);

    // Handle CAPTCHA manual requirement
    if (error.message === "CAPTCHA_MANUAL_REQUIRED") {
      console.log("Beralih ke mode manual untuk menyelesaikan CAPTCHA...");
      return await tanakaManual(sock, jid, statConfig, options);
    }

    const duration = Date.now() - startTime;
    return {
      error: error.message,
      hasValidResult: false,
      duration,
    };
  }
}

// --- MANUAL MODE ---
export async function tanakaManual(sock, jid, statConfig = null, options = {}) {
  console.log("Mode Manual - Browser akan terbuka untuk interaksi manual");

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto(CONFIG.BASE_URL, { waitUntil: "networkidle2" });

    // If statConfig provided, fill the form automatically
    if (statConfig) {
      console.log("📝 Mengisi formulir secara otomatis...");
      await page.waitForSelector("#paramLevel", { timeout: 10000 });

      const { positiveStats, negativeStats, startingPotential, characterLevel } = statConfig;
      await page.select("#paramLevel", String(characterLevel));

      for (let i = 0; i < Math.min(7, positiveStats.length); i++) {
        const stat = positiveStats[i];
        await page.select(`#plus_name_${i}`, stat.name);
        await page.select(`#plus_value_${i}`, String(stat.level));
      }

      for (let i = 0; i < Math.min(7, negativeStats.length); i++) {
        const stat = negativeStats[i];
        await page.select(`#minus_name_${i}`, stat.name);
        await page.select(`#minus_value_${i}`, String(stat.level));
      }

      await page.evaluate((pot) => {
        document.querySelector("#shokiSenzai").value = pot;
      }, String(startingPotential));

      console.log("Form telah diisi otomatis");
    }

    console.log("Silakan selesaikan CAPTCHA dan tunggu hasil muncul...");
    console.log("Setelah hasil lengkap terlihat, tekan Enter untuk parsing...");
    await waitForEnter();

    const result = await parseAllResults(page);
    console.log("\n--- HASIL MANUAL --- 🎉");
    console.log(JSON.stringify(result, null, 2));

    // Send via socket if provided
    if (sock && jid && result.hasValidResult) {
      try {
        const message = formatResultMessage(result);
        await sock.sendMessage(jid, { text: message });
        console.log("Hasil dikirim via WhatsApp");
      } catch (sendError) {
        console.log("Gagal mengirim ke WhatsApp:", sendError.message);
      }
    }

    return result;
  } finally {
    await browser.close();
  }
}

// --- SMART MODE ---
export async function tanakaSmart(sock, jid, statConfig = null, options = {}) {
  console.log("Mode Smart - Otomatis dengan fallback manual");

  try {
    // Use provided config or default
    const config = statConfig || {
      positiveStats: [{ name: "Critical Damage", level: "MAX" }],
      negativeStats: [{ name: "Accuracy", level: "MAX" }],
      characterLevel: CONFIG.DEFAULT_LEVEL,
      startingPotential: CONFIG.DEFAULT_POTENTIAL,
    };

    // Try automatic first
    const result = await tanaka(config, { ...options, headless: true, maxWaitTime: 60000 });

    // If successful, return result
    if (result.hasValidResult) {
      console.log("Mode otomatis berhasil!");
      return result;
    }

    // If failed or incomplete, try manual
    console.log("Mode otomatis tidak berhasil, beralih ke mode manual...");
    return await tanakaManual(sock, jid, config, options);
  } catch (error) {
    console.log("Mode otomatis gagal:", error.message);
    console.log("Beralih ke mode manual...");
    return await tanakaManual(sock, jid, statConfig, options);
  }
}

// --- MESSAGE FORMATTING ---
// function formatResultMessage(result) {
// 	if (result.error) {
// 		return `❌ *Error Tanaka Scraper:*\n${result.error}`;
// 	}

// 	if (!result.hasValidResult) {
// 		return `⚠️ *Tanaka Scraper:*\nHasil tidak lengkap atau gagal memuat`;
// 	}

// 	let message = `🎯 *Hasil Enhancement Tanaka*\n\n`;
// 	message += `📈 *Success Rate:* ${result.successRate}\n`;
// 	message += `💰 *Starting Pot:* ${result.startingPot}\n`;
// 	message += `📊 *Matrial Cost:* ${result.materialCost}\n`;
// 	message += `🔢 *Total Steps:* ${result.totalSteps}\n`;

// 	if (result.materialCost !== "Tidak ditemukan") {
// 		message += `💎 *Material Cost:* ${result.materialCost}\n`;
// 	}

// 	if (result.steps.length > 0) {
// 		message += `\n📋 *Langkah Enhancement:*\n`;
// 		result.steps.slice(0, 5).forEach((step) => {
// 			message += `${step}\n`;
// 		});
// 		if (result.steps.length > 5) {
// 			message += `... dan ${result.steps.length - 5} langkah lainnya\n`;
// 		}
// 	}

// 	if (result.duration) {
// 		message += `\n⏱️ *Waktu Eksekusi:* ${Math.round(result.duration / 1000)}s`;
// 	}

// 	message += `\n⏰ *Dibuat:* ${new Date(result.timestamp).toLocaleString("id-ID")}`;

// 	return message;
// }

// --- HELPER FUNCTIONS ---
export function getAvailableStats(sock, chatId, msg) {
  console.log("\n📋 Daftar Stat Yang Tersedia:");
  console.log("Format: +[nama][level] untuk positive, -[nama][level] untuk negative");
  console.log("Level: angka (1-9) atau 'max'\n");

  Object.entries(statMap).forEach(([key, value]) => {
    console.log(`${key.padEnd(12)} -> ${value}`);
    sock.sendMessage(chatId, { text: `*${key.padEnd(12)}* -> ${value}` }, { reply: msg });
  });

  return statMap;
}

export function validateStatConfig(config) {
  const errors = [];
  const warnings = [];

  if (!config || typeof config !== "object") {
    errors.push("Konfigurasi tidak valid");
    return { valid: false, errors, warnings };
  }

  // Validate level
  if (config.characterLevel < 1 || config.characterLevel > 500) {
    errors.push("Level karakter harus antara 1-500");
  }

  // Validate potential
  if (config.startingPotential < 0 || config.startingPotential > 200) {
    errors.push("Starting potential harus antara 0-200");
  }

  // Check if at least one stat is provided
  if (config.positiveStats.length === 0 && config.negativeStats.length === 0) {
    warnings.push("Tidak ada stat yang dikonfigurasi, akan menggunakan default");
  }

  // Validate stats
  const allStats = [...config.positiveStats, ...config.negativeStats];
  const statNames = allStats.map((s) => s.name);
  const duplicates = statNames.filter((name, index) => statNames.indexOf(name) !== index);

  if (duplicates.length > 0) {
    warnings.push(`Stat duplikat ditemukan: ${duplicates.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalPositive: config.positiveStats.length,
      totalNegative: config.negativeStats.length,
      level: config.characterLevel,
      potential: config.startingPotential,
    },
  };
}

export function createExampleConfigs() {
  return {
    // DPS Build
    dps: parseCommand([
      "+critdmgmax",
      "+critratemax",
      "+atk%max",
      "+aspd%max",
      "-accuracymax",
      "-dodgemax",
      "lv280",
      "pot100",
    ]),

    // Tank Build
    tank: parseCommand([
      "+defmax",
      "+mdefmax",
      "+hp%max",
      "+vit%max",
      "-critratemax",
      "-critdmgmax",
      "-aspd%max",
      "lv280",
      "pot100",
    ]),

    // Mage Build
    mage: parseCommand([
      "+matk%max",
      "+int%max",
      "+cspd%max",
      "+mp%max",
      "-aspd%max",
      "-strmax",
      "-defmax",
      "lv280",
      "pot100",
    ]),

    // Support Build
    support: parseCommand([
      "+hp%max",
      "+mp%max",
      "+hpreg%max",
      "+mpreg%max",
      "-atkmax",
      "-aspd%max",
      "lv280",
      "pot100",
    ]),

    // Max All Positive
    maxPositive: parseCommand([
      "+critdmgmax",
      "+critratemax",
      "+atk%max",
      "+aspd%max",
      "+hp%max",
      "+defmax",
      "+accmax",
      "lv280",
      "pot100",
    ]),

    // Balanced
    balanced: parseCommand([
      "+critdmgmax",
      "+atk%max",
      "+hp%max",
      "-dodge5",
      "-mdef3",
      "lv250",
      "pot90",
    ]),
  };
}

// --- EXPORTS ---
export { parseCommand, parseAllResults, formatResultMessage, statMap, CONFIG };

export default {
  tanaka,
  tanakaManual,
  tanakaSmart,
  parseCommand,
  parseAllResults,
  formatResultMessage,
  getAvailableStats,
  validateStatConfig,
  createExampleConfigs,
  statMap,
  CONFIG,
};
