import { createCanvas, loadImage } from "canvas"
import axios from "axios"

export const generateWelcomeImage = async (ppUrl, userName, groupName) => {
  const width = 800
  const height = 200

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext("2d")

  // background
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, width, height)

  // card
  ctx.fillStyle = "#e5e7eb"
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
  ctx.fillStyle = "#000000"
  ctx.font = "bold 34px Sans"
  ctx.fillText("Hai", 200, 100)

  ctx.font = "28px Sans"
  ctx.fillText(userName, 240, 165)

  ctx.font = "18px Sans"
  ctx.fillStyle = "#000000"
  ctx.fillText(`to ${groupName}`, 240, 205)

  ctx.font = "20px Sans"
  ctx.fillText("gunakan !menu untuk menggunakan Neura", 240, 245)

  return canvas.toBuffer()
}

