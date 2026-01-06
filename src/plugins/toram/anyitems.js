import { supabase } from "../../model/supabase.js"

export const searchXtall = async (sock, chatId, msg, text) => {
  try {
    const nama = text.replace("!xtall", "")
    if (!nama) return sock.sendMessage(chatId, { text: "format salah\n> gunakan !xtall <name>" }, { quoted: msg });
    const { dataXtall, error } = supabase.from("xtall").select("name, type, upgrade, stat").ilike("name", `%${nama}%`)
    if (error) {
      console.log(error);
      sock.sendMessage(chatId, { text: "internal server error" }, { quoted: msg });
    }
    if (!dataXtall || dataXtall.length === 0) return sock.sendMessage(chatId, { text: "xtall tidak ditemukan" }, { quoted: msg });
    const xtall = dataXtall[0]
    const messageData = `
    *SEARCH XTALL*\n> By Neura Bot

    Nama: ${xtall.name}
    Type: ${xtall.type}
    upgrade: ${xtall.upgrade}
    stat: ${xtall.stat}

    `.trim()

    sock.sendMessage(chatId, { text: messageData }, { quoted: msg });
  } catch (err) {
    console.log(err);
  }
}

export const searchRegist = async () => {

}

export const searchAbility = async () => {

}


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

