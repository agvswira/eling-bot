import cron from "node-cron";
import { WASocket } from "@whiskeysockets/baileys";
import * as deadlineStore from "../storage/deadline.store";
import { formatReminder } from "../utils/format";
import { reminderH1Instant, reminderH3Instant, deadlineToInstant } from "../utils/time";

// Toleransi: reminder yang waktunya sudah lewat masih dikirim selama belum
// melewati deadline + grace, agar deadline yang baru dibuat tetap dapat reminder.
const GRACE_MS = 60 * 60 * 1000; // 1 jam

/**
 * Periksa semua deadline aktif dan kirim reminder bila waktunya tiba.
 * Dipanggil tiap menit oleh cron.
 */
async function checkAndSend(sock: WASocket): Promise<void> {
  const items = await deadlineStore.getActive();
  const now = Date.now();

  for (const d of items) {
    if (!d.groupId) continue; // tidak tahu harus kirim ke mana

    const deadlineMs = deadlineToInstant(d.dueDate, d.dueTime).getTime();
    // Lewati jika deadline sudah benar-benar berlalu.
    if (now > deadlineMs + GRACE_MS) continue;

    const h1 = reminderH1Instant(d.dueDate).getTime();
    const h3 = reminderH3Instant(d.dueDate, d.dueTime).getTime();

    // Reminder H-1 (jam 07:00 WITA sehari sebelum).
    if (!d.remindedH1 && now >= h1 && now < deadlineMs) {
      await send(sock, d.groupId, formatReminder(d));
      await deadlineStore.update(d.id, { remindedH1: true });
    }

    // Reminder 3 jam sebelum deadline.
    if (!d.remindedH3 && now >= h3 && now < deadlineMs + GRACE_MS) {
      await send(sock, d.groupId, formatReminder(d));
      await deadlineStore.update(d.id, { remindedH3: true });
    }
  }
}

async function send(sock: WASocket, jid: string, text: string): Promise<void> {
  try {
    await sock.sendMessage(jid, { text });
    console.log(`📤 Reminder terkirim ke ${jid}`);
  } catch (err: any) {
    console.error("Gagal mengirim reminder:", err?.message || err);
  }
}

/** Mulai cron job reminder (tiap menit). */
export function startReminderScheduler(sock: WASocket): void {
  // Jalankan tiap menit. node-cron memakai waktu lokal server.
  cron.schedule("* * * * *", () => {
    checkAndSend(sock).catch((err) =>
      console.error("Scheduler error:", err?.message || err)
    );
  });
  console.log("⏰ Scheduler reminder aktif (cek tiap menit).");
}
