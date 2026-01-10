import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import axios from "axios";

ffmpeg.setFfmpegPath(ffmpegPath);

export const downloadToMp3 = async (url, output) => {
  const tempFile = "temp.mp4";

  // download video
  const res = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  const writer = fs.createWriteStream(tempFile);
  res.data.pipe(writer);

  await new Promise(resolve => writer.on("finish", resolve));

  // convert ke mp3
  return new Promise((resolve, reject) => {
    ffmpeg(tempFile)
      .audioBitrate(128)
      .save(output)
      .on("end", () => {
        fs.unlinkSync(tempFile);
        resolve(output);
      })
      .on("error", reject);
  });
};

