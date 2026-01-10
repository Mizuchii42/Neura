import { adminValid, botValid } from "./controlAdmin.js";
import { downloadMediaMessage } from "@whiskeysockets/baileys";
export const hidetag = async (sock, chatId, msg, text) => {
  try {
    const arg = text.replace("!hidetag", "");

    // Validate group chat
    if (!chatId.endsWith("@g.us")) {
      return await sock.sendMessage(
        chatId,
        { text: " Fitur hidetag hanya bisa digunakan di grup." },
        { quoted: msg }
      );
    }

    // Check admin permission

    // Get group metadata
    const groupMetadata = await sock.groupMetadata(chatId);
    if (!groupMetadata?.participants?.length) {
      return await sock.sendMessage(
        chatId,
        { text: "Tidak dapat mengambil informasi grup atau grup kosong." },
        { quoted: msg }
      );
    }

    // Create mentions array (filter out bot and inactive users)
    const mentions = groupMetadata.participants
      .filter((participant) => participant.id !== sock.user?.id) // Exclude bot
      .map((participant) => participant.id);

    if (mentions.length === 0) {
      return await sock.sendMessage(
        chatId,
        { text: "Tidak ada member yang dapat di-tag." },
        { quoted: msg }
      );
    }

    // Handle quoted messages
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quotedMsg) {
      return await handleQuotedMessage(sock, chatId, msg, quotedMsg, mentions);
    }

    // Send regular hidetag message
    if (arg?.trim()) {
      await sock.sendMessage(
        chatId,
        {
          text: arg.trim(),
          mentions: mentions,
        },
        { quoted: msg }
      );
    }
  } catch (error) {
    console.error("Error in hidetag function:", error);
    await sock.sendMessage(
      chatId,
      { text: "Gagal menjalankan hidetag. Silakan coba lagi." },
      { quoted: msg }
    );
  }
};

// Handle quoted messages including media
const handleQuotedMessage = async (sock, chatId, msg, quotedMsg, mentions) => {
  try {
    console.log("[Hidetag] Processing quoted message");

    // Handle text messages
    if (quotedMsg.conversation || quotedMsg.extendedTextMessage?.text) {
      const messageText = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
      return await sock.sendMessage(
        chatId,
        {
          text: messageText,
          mentions: mentions,
        },
        { quoted: msg }
      );
    }

    // For media messages, try to re-download and forward with mentions
    const mediaTypes = [
      { key: "imageMessage", type: "image" },
      { key: "videoMessage", type: "video" },
      { key: "documentMessage", type: "document" },
      { key: "audioMessage", type: "audio" },
      { key: "stickerMessage", type: "sticker" },
    ];

    for (const { key, type } of mediaTypes) {
      if (quotedMsg[key]) {
        console.log(`[Hidetag] Found ${type} message, attempting to download`);
        try {
          const buffer = await downloadMediaMessage(
            {
              key: msg.message.extendedTextMessage.contextInfo.stanzaId,
              message: {
                [key]: quotedMsg[key],
              },
            },
            "buffer",
            {},
            {
              reuploadRequest: sock.reuploadRequest,
            }
          );

          console.log(`[Hidetag] Successfully downloaded ${type}`);
          const mediaContent = quotedMsg[key];
          const caption = mediaContent.caption || "";

          return await sock.sendMessage(
            chatId,
            {
              [type]: buffer,
              caption: caption,
              mentions: mentions,
              mimetype: mediaContent.mimetype,
            },
            { quoted: msg }
          );
        } catch (downloadError) {
          console.error(`[Hidetag] Failed to download ${type}:`, downloadError);
          // If download fails, at least send the caption with mentions
          if (quotedMsg[key].caption) {
            return await sock.sendMessage(
              chatId,
              {
                text: quotedMsg[key].caption,
                mentions: mentions,
              },
              { quoted: msg }
            );
          }
        }
      }
    }

    // Fallback for unsupported message types
    await sock.sendMessage(
      chatId,
      {
        text: "",
        mentions: mentions,
      },
      { quoted: msg }
    );
  } catch (error) {
    console.error("Error handling quoted message:", error);
    throw error;
  }
};
