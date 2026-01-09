import puppeteer from "puppeteer";

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
   PARSE INPUT BAB
======================= */
const parseChapterInput = (input) => {
  if (!input) return QUEST_MAPPING.all;

  const key = input.toLowerCase().trim();

  if (QUEST_MAPPING[key]) return QUEST_MAPPING[key];

  const range = key.match(/(\d+)-(\d+)/);
  if (range) {
    const start = `bab${range[1]}`;
    const end = `bab${range[2]}`;
    if (QUEST_MAPPING[start] && QUEST_MAPPING[end]) {
      return {
        from: QUEST_MAPPING[start].from,
        until: QUEST_MAPPING[end].until,
        name: `Bab ${range[1]}-${range[2]}`,
      };
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
  if (!lv_char || !exp_char || !lv_target || !fromQuest || !untilQuest) return showUsageExamples(sock, chatId, msg)

  try {
    lv_char = parseInt(lv_char);
    exp_char = parseInt(exp_char) || 0;
    lv_target = parseInt(lv_target);

    if (lv_char >= lv_target) {
      throw new Error("Target level harus lebih tinggi");
    }

    const questRange =
      fromQuest && untilQuest
        ? {
          from: parseInt(fromQuest),
          until: parseInt(untilQuest),
          name: `Quest ${fromQuest}-${untilQuest}`,
        }
        : parseChapterInput(fromQuest);

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-gpu"],
    });

    const page = await browser.newPage();
    await page.goto("https://toramtools.github.io/xp.html", {
      waitUntil: "networkidle2",
    });

    await page.type("#level", lv_char.toString());
    await page.type("#level-percentage", exp_char.toString());
    await page.type("#target-level", lv_target.toString());

    await page.click("#mq-ui");
    await page.select("#mq-from", questRange.from.toString());
    await page.select("#mq-until", questRange.until.toString());

    await page.waitForTimeout(1500);

    const result = await page.evaluate(() => ({
      xpRequired: document.querySelector("#xp-required")?.textContent,
      xpGained: document.querySelector("#mq-xp")?.textContent,
      finalLevel: document.querySelector("#mq-eval")?.textContent,
    }));

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
   MAIN QUEST SPAM
======================= */
export const spamMainQuest = async (
  sock,
  chatId,
  msg,
  lv_char,
  exp_char,
  lv_target,
  chapterInput = null
) => {
  let browser;

  try {
    lv_char = parseInt(lv_char);
    exp_char = parseInt(exp_char) || 0;
    lv_target = parseInt(lv_target);

    const questRange = parseChapterInput(chapterInput);

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto("https://toramtools.github.io/xp.html", {
      waitUntil: "networkidle2",
    });

    await page.type("#level", lv_char.toString());
    await page.type("#level-percentage", exp_char.toString());
    await page.type("#target-level", lv_target.toString());

    await page.click("#mq-ui");
    await page.select("#mq-from", questRange.from.toString());
    await page.select("#mq-until", questRange.until.toString());
    await page.click("#multiple-mq");

    await page.waitForTimeout(2000);

    const runs = await page.evaluate(() =>
      [...document.querySelectorAll("#mq-table-row")].map(row => {
        const div = row.querySelectorAll("div");
        return div[2]?.textContent;
      })
    );

    let text = `
Main Quest Spam (${questRange.name})
Level ${lv_char} -> ${lv_target}
Total Run: ${runs.length}
`.trim();

    runs.slice(0, 10).forEach((r, i) => {
      text += `\nRun ${i + 1}: ${r}`;
    });

    await sock.sendMessage(chatId, { text }, { quoted: msg });
    return runs;
  } catch (err) {
    await sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  } finally {
    if (browser) await browser.close();
  }
};

/* =======================
   USAGE HELP
======================= */
export const showUsageExamples = async (sock, chatId, msg) => {
  const text = `
!spamadv 200|50|250|bab5
!spamadv 200|50|250|1 45
!spamadv 200|50|250|semua

`.trim();

  await sock.sendMessage(chatId, { text }, { quoted: msg });
};

export default {
  spamAdv,
  spamMainQuest,
  showUsageExamples,
};

