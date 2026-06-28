import { WASocket, proto } from "@whiskeysockets/baileys";
import { CommandContext } from "../commands/context";
import { handleCommand } from "./command";
import { handleMention } from "./mention";
import { isAIEnabled } from "../ai";

const BOT_NAME = (process.env.BOT_NAME || "Eling").toLowerCase();
const ADMIN_NUMBER = (process.env.ADMIN_NUMBER || "").replace(/\D/g, "");
// Set DEBUG=1 di .env untuk melihat log deteksi mention di grup.
const DEBUG = process.env.DEBUG === "1" || process.env.DEBUG === "true";

/** Ambil teks dari berbagai tipe pesan WhatsApp. */
function extractText(msg: proto.IMessage | null | undefined): string {
  if (!msg) return "";
  return (
    msg.conversation ||
    msg.extendedTextMessage?.text ||
    msg.imageMessage?.caption ||
    msg.videoMessage?.caption ||
    msg.documentMessage?.caption ||
    ""
  );
}

/** Nomor murni (digit) dari sebuah JID, mis. "628123@s.whatsapp.net" → "628123". */
function numberFromJid(jid: string | null | undefined): string {
  if (!jid) return "";
  return jid.split("@")[0].split(":")[0].replace(/\D/g, "");
}

/** Apakah sebuah JID mention cocok dengan salah satu identitas bot (nomor / LID)? */
function matchesBot(jid: string, botIds: string[]): boolean {
  const num = numberFromJid(jid);
  return botIds.some((b) => {
    // Cocokkan JID penuh (mis. "xxx@lid") ATAU bagian nomornya.
    if (jid === b) return true;
    const bNum = numberFromJid(b);
    return bNum !== "" && bNum === num;
  });
}

/** Cek apakah bot di-mention (via mentionedJid atau penyebutan nama). */
function isBotMentioned(
  msg: proto.IMessage | null | undefined,
  text: string,
  botIds: string[],
): boolean {
  const ctxInfo =
    msg?.extendedTextMessage?.contextInfo || (msg as any)?.contextInfo;
  const mentioned: string[] = ctxInfo?.mentionedJid || [];
  if (mentioned.some((j) => matchesBot(j, botIds))) return true;

  // Fallback tekstual: sebut nama bot di awal/dalam pesan.
  return (
    text.toLowerCase().includes(`@${BOT_NAME}`) ||
    new RegExp(`(^|\\s)${BOT_NAME}\\b`, "i").test(text)
  );
}

/** Buang penyebutan nama/mention dari teks agar AI dapat pesan bersih. */
function stripMention(text: string): string {
  return text
    .replace(new RegExp(`@${BOT_NAME}`, "ig"), "")
    .replace(new RegExp(`^\\s*${BOT_NAME}[,:]?\\s*`, "i"), "")
    .replace(/@\d{6,}/g, "") // buang mention berupa nomor mentah
    .trim();
}

/**
 * Handler utama untuk setiap pesan masuk.
 */
export async function handleMessage(
  sock: WASocket,
  m: proto.IWebMessageInfo,
  botIds: string[],
): Promise<void> {
  // Abaikan pesan dari bot sendiri & pesan tanpa konten.
  if (m.key.fromMe) return;
  const remoteJid = m.key.remoteJid;
  if (!remoteJid || remoteJid === "status@broadcast") return;

  const text = extractText(m.message);
  if (!text.trim()) return;

  const isGroup = remoteJid.endsWith("@g.us");
  // Scope data: pakai JID chat (grup atau DM) sebagai identitas penyimpanan.
  const groupId = remoteJid;

  // Pengirim: di grup pakai participant, di pribadi pakai remoteJid.
  const senderJid = isGroup ? m.key.participant || "" : remoteJid;
  const sender = numberFromJid(senderJid);
  const isAdmin = ADMIN_NUMBER !== "" && sender === ADMIN_NUMBER;

  const cmdCtx: CommandContext = { sender, groupId, isAdmin };

  const trimmed = text.trim();

  try {
    // 1) Command mode: pesan diawali "!".
    if (trimmed.startsWith("!")) {
      const reply = await handleCommand(trimmed, cmdCtx);
      if (reply) await reply2(sock, remoteJid, m, reply);
      return;
    }

    // 2) AI mode: di grup harus di-mention/reply; di DM cukup kirim pesan.
    const mentioned = isBotMentioned(m.message, trimmed, botIds);
    const isReplyToBot = isReplyTargetingBot(m.message, botIds);

    if (DEBUG && isGroup) {
      const ctxInfo =
        m.message?.extendedTextMessage?.contextInfo ||
        (m.message as any)?.contextInfo;
      console.log(
        `[debug] grup pesan: "${trimmed}" | mentionedJid=${JSON.stringify(
          ctxInfo?.mentionedJid || [],
        )} | botIds=${JSON.stringify(botIds)} | mentioned=${mentioned} replyToBot=${isReplyToBot}`,
      );
    }

    const shouldUseAI = isGroup ? mentioned || isReplyToBot : true;

    if (shouldUseAI && isAIEnabled()) {
      if (isAdmin) {
        console.log(
          `[admin] Pesan dari admin (${sender}) diproses dengan bypass.`,
        );
      }
      const clean = stripMention(trimmed);
      await sock.sendPresenceUpdate("composing", remoteJid).catch(() => {});
      const reply = await handleMention(clean, { sender, groupId, isAdmin });
      await reply2(sock, remoteJid, m, reply);
      return;
    }

    // 3) Selain itu → diabaikan (sesuai spec).
  } catch (err: any) {
    console.error("Gagal memproses pesan:", err?.message || err);
    await reply2(
      sock,
      remoteJid,
      m,
      "⚠️ Aduh, ada error saat memproses pesanmu. Coba lagi ya.",
    ).catch(() => {});
  }
}

/** Apakah pesan ini me-reply pesan yang dikirim oleh bot? */
function isReplyTargetingBot(
  msg: proto.IMessage | null | undefined,
  botIds: string[],
): boolean {
  const ctxInfo = msg?.extendedTextMessage?.contextInfo;
  if (!ctxInfo) return false;
  const participant = ctxInfo.participant;
  if (!participant) return false;
  return matchesBot(participant, botIds);
}

/** Kirim balasan sambil mengutip pesan asli. */
async function reply2(
  sock: WASocket,
  jid: string,
  quoted: proto.IWebMessageInfo,
  text: string,
): Promise<void> {
  await sock.sendMessage(jid, { text }, { quoted });
}
