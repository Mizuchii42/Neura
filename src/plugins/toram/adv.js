import puppeteer from "puppeteer";

/* =======================
   HELPER
======================= */
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

/* =======================
   QUEST MAPPING
======================= */
const QUEST_MAPPING = {
  bab1: { from: 1, until: 9, name: "Bab 1" },
  bab2: { from: 11, until: 18, name: "Bab 2" },
  bab3: { from: 20, until: 27, name: "Bab 3" },
  bab4: { from: 29, until: 36, name: "Bab 4" },
  bab5: { from: 38, until: 45, name: "Bab 5" },
  bab6: { from: 47, until: 55, name: "Bab 6" },
  bab7: { from: 57, until: 64, name: "Bab 7" },
  bab8: { from: 66, until: 75, name: "Bab 8" },
  bab9: { from: 77, until: 86, name: "Bab 9" },
  bab10: { from: 88, until: 95, name: "Bab 10" },
  bab11: { from: 97, until: 105, name: "Bab 11" },
  bab12: { from: 107, until: 115, name: "Bab 12" },
  bab13: { from: 117, until: 124, name: "Bab 13" },
  bab14: { from: 126, until: 132, name: "Bab 14" },
  bab15: { from: 134, until: 136, name: "Bab 15" },
  all: { from: 1, until: 136, name: "Semua Bab" },
  semua: { from: 1, until: 136, name: "Semua Bab" },
};

/* =======================
   PARSE INPUT
======================= */
const parseChapterInput = (input) => {
  if (!input) return QUEST_MAPPING.all;

  const key = input.toLowerCase().trim();
  if (QUEST_MAPPING[key]) return QUEST_MAPPING[key];

  const range = key.match(/(\d+)-(\d+)/);
  if (range) {
    const s = QUEST_MAPPING[`bab${range[1]}`];
    const e = QUEST_MAPPING[`bab${range[2]}`];
    if (s && e) {
      return { from: s.from, until: e.until, name: `Bab ${range[1]}-${range[2]}` };
    }
  }

  const single = key.match(/(\d+)/);
  if (single && QUEST_MAPPING[`bab${single[1]}`]) {
    return QUEST_MAPPING[`bab${single[1]}`];
  }

  return QUEST_MAPPING.all;
};

/* =======================
   MAIN QUEST CALCULATOR
======================= */
export const spamAdv = async (
  sock,
  chatId,
  msg,
  lv_char,
  exp_char,
  lv_target,
  fromQuest = null,
  untilQuest = null
) => {
  let browser;

  if (!lv_char || !lv_target) {
    return showUsageExamples(sock, chatId, msg);
  }

  try {
    lv_char = Number(lv_char);
    exp_char = Number(exp_char) || 0;
    lv_target = Number(lv_target);

    if (lv_char >= lv_target) {
      throw new Error("Target level harus lebih tinggi");
    }

    const questRange =
      fromQuest && untilQuest
        ? {
          from: Number(fromQuest),
          until: Number(untilQuest),
          name: `Quest ${fromQuest}-${untilQuest}`,
        }
        : parseChapterInput(fromQuest);

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
    await page.goto("https://toramtools.github.io/xp.html", {
      waitUntil: "networkidle2",
    });

    await page.type("#level", String(lv_char));
    await page.type("#level-percentage", String(exp_char));
    await page.type("#target-level", String(lv_target));

    await page.click("#mq-ui");
    await sleep(500);

    await page.select("#mq-from", String(questRange.from));
    await page.select("#mq-until", String(questRange.until));

    // tunggu hasil UI benar-benar muncul
    await page.waitForFunction(() =>
      [...document.querySelectorAll("div")]
        .some(el => el.textContent.includes("After doing Main Quest"))
    );

    const result = await page.evaluate(() => {
      const getText = (keyword) =>
        [...document.querySelectorAll("div")]
          .find(el => el.textContent.includes(keyword))
          ?.textContent || "-";

      return {
        xpRequired: getText("Total XP required:")
          .replace("Total XP required:", "")
          .trim(),
        xpGained: getText("XP:")
          .replace("XP:", "")
          .trim(),
        finalLevel: getText("After doing Main Quest")
          .replace("After doing Main Quest's above range you'll reach", "")
          .trim(),
      };
    });

    const text = `
Main Quest Calculator (${questRange.name})

Level ${lv_char} (${exp_char}%) -> ${lv_target}
Quest ${questRange.from}-${questRange.until}

XP Required : ${result.xpRequired}
XP Gained   : ${result.xpGained}
Result      : ${result.finalLevel}
`.trim();

    await sock.sendMessage(chatId, { text }, { quoted: msg });
    return result;

  } catch (err) {
    await sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  } finally {
    if (browser) await browser.close();
  }
};

/* =======================
   USAGE
======================= */
export const showUsageExamples = async (sock, chatId, msg) => {
  const text = `
spamadv|200|50|250|bab7-12
spamadv|200|50|250|1|115
spamadv|200|50|250|semua
`.trim();

  await sock.sendMessage(chatId, { text }, { quoted: msg });
};

export default { spamAdv };

