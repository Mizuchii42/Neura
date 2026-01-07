import fs from "fs/promises";
import path from "path";

const TORAM_DB = path.resolve("aset", "toram_data_complete.json");

export const readToramData = async () => {
  try {
    const raw = await fs.readFile(TORAM_DB, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.log(err);
    return null;
  }
};

