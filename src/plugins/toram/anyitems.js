import { supabase } from "../../model/supabase.js"
const formatStatList = (stat) => {
  if (!stat || stat === "None") return "- None";

  return stat
    .split("|")
    .map(s => `- ${s.trim()}`)
    .join("\n");
};


export const searchXtall = async (sock, chatId, msg, text) => {
  try {
    const nama = text.replace("!xtall", "").trim();

    if (!nama) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> gunakan !xtall <name>" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("xtall")
      .select("name, type, upgrade, stat")
      .ilike("name", `%${nama}%`)
      .limit(1);

    if (error) {
      console.log(error);
      return sock.sendMessage(
        chatId,
        { text: "Internal server error" },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Xtall tidak ditemukan" },
        { quoted: msg }
      );
    }

    const xtall = data[0];

    const messageData = `
*SEARCH XTALL*
> By Neura Bot
Nama    : ${xtall.name}
Type    : ${xtall.type}
Upgrade : ${xtall.upgrade}
Stat    : ${xtall.stat}
`.trim();

    sock.sendMessage(
      chatId,
      { text: messageData },
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


export const searchRegist = async (sock, chatId, msg, text) => {
  try {
    const nama = text.replace("!regist", "").trim();

    if (!nama) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> gunakan !regist <nama regist>" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("regist")
      .select("name, effect, max_lv, levels_studied")
      .ilike("name", `%${nama}%`);

    if (error) {
      console.log(error);
      return sock.sendMessage(
        chatId,
        { text: "Internal server error" },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Regist tidak ditemukan" },
        { quoted: msg }
      );
    }

    const messageData = `
*SEARCH REGIST*
> By Neura Bot
${data.map((rg, i) => `
${rg.name}
Effect         : ${rg.effect}
Max Level      : ${rg.max_lv}
Levels Studied : ${rg.levels_studied}
`).join("\n")}
`.trim();

    sock.sendMessage(
      chatId,
      { text: messageData },
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



export const searchAbility = async (sock, chatId, msg, text) => {
  try {
    const nama = text.replace("!ability", "").trim();

    if (!nama) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> gunakan !ability <nama ability>" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("ability")
      .select("name, stat_effect, tier, stat_id")
      .ilike("name", `%${nama}%`);

    if (error) {
      console.log(error);
      return sock.sendMessage(
        chatId,
        { text: "Internal server error" },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Ability tidak ditemukan" },
        { quoted: msg }
      );
    }

    const messageData = `
*SEARCH ABILITY*
> By Neura Bot
${data.map((ab, i) => `
${ab.name}
Tier        : ${ab.tier}
Stat Effect : ${ab.stat_effect}
Stat ID     : ${ab.stat_id}
`).join("\n")}
`.trim();

    sock.sendMessage(
      chatId,
      { text: messageData },
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




export const searchItem = async (sock, chatId, msg, text) => {
  try {
    const namaItem = text.replace("!item", "").trim();

    if (!namaItem) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> gunakan !item <nama item>" },
        { quoted: msg }
      );
    }
    if (namaItem.length > 3) return sock.sendMessage(chatId, { text: "masukan 3 huruf awal" }, { quoted: msg })

    const { data, error } = await supabase
      .from("item")
      .select("nama, jenis, stat, drop")
      .ilike("nama", `%${namaItem}%`);

    if (error) {
      console.log(error);
      return sock.sendMessage(
        chatId,
        { text: "Internal server error" },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Item tidak ditemukan" },
        { quoted: msg }
      );
    }

    const messageData = `
*SEARCH ITEM*
> By Neura Bot
${data.map((item, i) => `
  ${item.nama}
Jenis : ${item.jenis}
Stat  :
${formatStatList(item.stat)}
Drop  : ${item.drop}
`).join("\n")}
`.trim();

    sock.sendMessage(
      chatId,
      { text: messageData.trim() },
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


export const searchApp = async (sock, chatId, msg, text) => {
  try {
    const nama = text.replace("!appview", "").trim();

    if (!nama) {
      return sock.sendMessage(
        chatId,
        { text: "Gunakan: !appview <nama>" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("appview")
      .select("name, image_url")
      .ilike("name", `${nama}%`)
      .limit(1);

    if (error) {
      console.log(error);
      return sock.sendMessage(
        chatId,
        { text: "Terjadi kesalahan saat mencari data" },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "App tidak ditemukan" },
        { quoted: msg }
      );
    }

    const app = data[0];

    const messageData = `
Nama App : ${app.name}
`.trim();

    await sock.sendMessage(
      chatId,
      {
        image: { url: app.image_url },
        caption: messageData
      },
      { quoted: msg }
    );

  } catch (err) {
    console.log(err);
    sock.sendMessage(
      chatId,
      { text: "Error internal" },
      { quoted: msg }
    );
  }
};

