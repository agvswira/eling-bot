import "dotenv/config";
import {
  default as makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import pino from "pino";

import { handleMessage } from "./handlers/message";
import { startReminderScheduler } from "./scheduler/reminder";
import { logAIMode } from "./ai";

const BOT_NAME = process.env.BOT_NAME || "Eling";
const AUTH_DIR = "auth_info_baileys";

const logger = pino({ level: "silent" });

async function start(): Promise<void> {
  console.log(`\n🤖 Menjalankan ${BOT_NAME} Bot...\n`);
  logAIMode();

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: [BOT_NAME, "Chrome", "1.0.0"],
    syncFullHistory: false,
    markOnlineOnConnect: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 Scan QR Code berikut dengan WhatsApp (nomor bot):\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log(
        `❌ Koneksi terputus (code: ${statusCode ?? "?"}).` +
          (loggedOut
            ? " Sesi logout — hapus folder auth & scan ulang."
            : " Mencoba reconnect..."),
      );
      if (!loggedOut) {
        setTimeout(() => start().catch(console.error), 3000);
      }
    } else if (connection === "open") {
      const me = sock.user?.id ? jidNormalizedUser(sock.user.id) : "";
      const lid = (sock.user as any)?.lid || "";
      console.log(
        `✅ ${BOT_NAME} terhubung sebagai ${me}${lid ? ` (lid: ${lid})` : ""}`,
      );
      console.log("🚀 Bot siap menerima pesan!\n");
      startReminderScheduler(sock);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    // Kumpulkan semua identitas bot: JID nomor & LID (WhatsApp versi baru).
    const botIds = [
      sock.user?.id ? jidNormalizedUser(sock.user.id) : "",
      (sock.user as any)?.lid || "",
    ].filter(Boolean);
    for (const m of messages) {
      try {
        await handleMessage(sock, m as proto.IWebMessageInfo, botIds);
      } catch (err: any) {
        console.error("Error pada messages.upsert:", err?.message || err);
      }
    }
  });
}

start().catch((err) => {
  console.error("Fatal error saat start:", err);
  process.exit(1);
});

// Tangani shutdown rapi.
process.on("SIGINT", () => {
  console.log("\n👋 Mematikan bot...");
  process.exit(0);
});
