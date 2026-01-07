import { readToramData } from "../../config/readToramData.js";

export const searchBosDef = async (sock, chatId, msg, text) => {
  try {
    const name = text.replace("!bosdef", "").trim();

    if (!name) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> gunakan !bosdef <nama boss>" },
        { quoted: msg }
      );
    }

    const data = await readToramData();
    if (!data || !Array.isArray(data.bosdef)) {
      return sock.sendMessage(
        chatId,
        { text: "Database bosdef tidak tersedia" },
        { quoted: msg }
      );
    }

    const result = data.bosdef.filter(b =>
      b.name.toLowerCase().includes(name.toLowerCase())
    );

    if (result.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Boss tidak ditemukan" },
        { quoted: msg }
      );
    }

    let message = `
*SEARCH BOS DEF*
> By Neura Bot
`.trim();

    result.forEach((b, i) => {
      message += `

${i + 1}. ${b.name}
   Level   : ${b.level}
   Element : ${b.element}
   HP      : ${b.hp}
   EXP     : ${b.xp}

   DEF     : ${b.def}
   MDEF    : ${b.mdef}
   FLEE    : ${b.flee}
   Guard   : ${b.guard}
   Evade   : ${b.evade}

   Proration:
   - Normal : ${b.proration_normal}
   - Phys   : ${b.proration_phys}
   - Magic  : ${b.proration_magic}

   Resistance:
   - Physical : ${b.res_phys}
   - Magic    : ${b.res_magic}
   - Critical : ${b.res_crit}
`;
    });

    sock.sendMessage(
      chatId,
      { text: message.trim() },
      { quoted: msg }
    );

  } catch (err) {
    console.log(err);
    sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan" },
      { quoted: msg }
    );
  }
};

