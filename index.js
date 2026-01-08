import makeWASocket, {
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import { Admincontrols } from "./src/admin/controlAdmin.js";
import dotenv from "dotenv";
import { ownerControls } from "./src/admin/owner.js";
import { cmdMenucontrol } from "./src/modul/cmdControls.js";
import { checkMentionAfk, checkUnAfk } from "./src/plugins/sosial/afk.js";
import { welcomeGroup } from "./src/plugins/fitur/setwellcome.js";
dotenv.config();
const start = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_save");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    try {
      if (qr) {
        qrcode.generate(qr, { small: true });
        console.log("Scan QR untuk login WhatsApp");
      }

      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;

        console.log("Koneksi terputus.");
        console.log("Reconnect?", shouldReconnect);

        if (shouldReconnect) {
          console.log("Reconnect dalam 5 detik...");
          setTimeout(start, 5000);
        } else {
          console.log(" Logout permanen. Hapus folder auth_save untuk login ulang.");
        }
      }

      if (connection === "open") {
        console.log(" Bot WhatsApp berhasil terhubung!");
      }
    } catch (err) {
      console.error("⚠️ Error:", err);
      setTimeout(start, 5000);
    }
  });
  sock.ev.on("group-participants.update", update => {
    welcomeGroup(sock, update)
  })
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    try {
      const chatId = msg.key.remoteJid;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
      if (!chatId?.endsWith("@g.us")) return;
      checkMentionAfk(sock, chatId, msg)
      checkUnAfk(sock, chatId, msg);
      Admincontrols(sock, chatId, msg, text);
      ownerControls(sock, chatId, msg, text);
      cmdMenucontrol(sock, chatId, msg, text);
    } catch (err) {
      console.log(err)
    }
  })
};

start();
