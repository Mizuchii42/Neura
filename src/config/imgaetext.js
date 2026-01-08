import { createCanvas, loadImage } from "canvas"
import axios from "axios"

export const generateWelcomeImage = async (ppUrl, userName, groupName) => {
  const WIDTH = 800
  const HEIGHT = 300

  const canvas = createCanvas(WIDTH, HEIGHT)
  const ctx = canvas.getContext("2d")

  /* ================= BACKGROUND ================= */

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // card
  ctx.fillStyle = "#e5e7eb"
  ctx.fillRect(20, 20, WIDTH - 40, HEIGHT - 40)

  /* ================= AVATAR ================= */

  let avatar
  try {
    const res = await axios.get(ppUrl, { responseType: "arraybuffer" })
    avatar = await loadImage(res.data)
  } catch {
    avatar = await loadImage("https://i.imgur.com/6VBx3io.png")
  }

  const AVATAR_X = 100
  const AVATAR_Y = HEIGHT / 2
  const AVATAR_RADIUS = 60

  ctx.save()
  ctx.beginPath()
  ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_RADIUS, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(
    avatar,
    AVATAR_X - AVATAR_RADIUS,
    AVATAR_Y - AVATAR_RADIUS,
    AVATAR_RADIUS * 2,
    AVATAR_RADIUS * 2
  )
  ctx.restore()

  /* ================= TEXT ================= */

  const TEXT_X = 200

  ctx.fillStyle = "#000000"

  ctx.font = "bold 34px Sans"
  ctx.fillText("Hai,", TEXT_X, 90)

  ctx.font = "28px Sans"
  ctx.fillText(userName, TEXT_X, 135)

  ctx.font = "20px Sans"
  ctx.fillText(`Selamat datang di ${groupName}`, TEXT_X, 175)

  ctx.font = "18px Sans"
  ctx.fillStyle = "#374151"
  ctx.fillText("Gunakan !menu untuk menggunakan Neura", TEXT_X, 215)

  return canvas.toBuffer()
}
