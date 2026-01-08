import { createCanvas, loadImage } from "canvas"
import axios from "axios"

export const generateWelcomeImage = async (ppUrl, userName, groupName) => {
  const width = 800
  const height = 400

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  // background
  ctx.fillStyle = "#020617"
  ctx.fillRect(0, 0, width, height)

  // card
  ctx.fillStyle = "#0f172a"
  ctx.fillRect(20, 20, width - 40, height - 40)

  // load avatar
  let avatar
  try {
    const res = await axios.get(ppUrl, { responseType: "arraybuffer" })
    avatar = await loadImage(res.data)
  } catch {
    avatar = await loadImage("https://i.imgur.com/6VBx3io.png")
  }

  // avatar circle
  ctx.save()
  ctx.beginPath()
  ctx.arc(120, 200, 70, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(avatar, 50, 130, 140, 140)
  ctx.restore()

  // text
  ctx.fillStyle = "#e5e7eb"
  ctx.font = "bold 34px Sans"
  ctx.fillText("Welcome", 240, 120)

  ctx.font = "28px Sans"
  ctx.fillText(userName, 240, 165)

  ctx.font = "22px Sans"
  ctx.fillStyle = "#94a3b8"
  ctx.fillText(`to ${groupName}`, 240, 205)

  ctx.font = "18px Sans"
  ctx.fillText("Semoga betah dan patuhi rules grup", 240, 245)

  return canvas.toBuffer()
}

