import cron from "node-cron";
import { WASocket } from "@whiskeysockets/baileys";
import * as deadlineStore from "../storage/deadline.store";
import { formatReminder, formatOverdue } from "../utils/format";
import { deadlineToInstant, nowWITA } from "../utils/time";

// Jendela "terlewat": notif deadline-lewat dikirim sampai 24 jam setelahnya.
const OVERDUE_WINDOW_MS = 24 * 60 * 60 * 1000;

// Jam reminder harian (WITA). Reminder dikirim sekali per hari mulai jam ini.
const DAILY_REMINDER_HOUR = 7;

/**
 * Periksa semua deadline & kirim notifikasi yang waktunya tiba.
 * Dipanggil tiap menit oleh cron. Logika:
 *  - Setiap hari pukul 07:00 WITA (atau setelahnya, sekali per hari) kirim
 *    reminder selama deadline belum lewat.
 *  - Saat deadline lewat, kirim notif "terlewat" satu kali.
 */
async function checkAndSend(sock: WASocket): Promise<void> {
  // Pindai SEMUA deadline lintas grup, lalu kirim ke grup masing-masing.
  const all = await deadlineStore.getAllGlobal();
  const items = all.filter((d) => !d.isDone);
  const now = Date.now();
  const wita = nowWITA();
  const witaHour = Number(wita.time.split(":")[0]);

  for (const d of items) {
    if (!d.groupId) continue; // tidak tahu harus kirim ke mana

    const deadlineMs = deadlineToInstant(d.dueDate, d.dueTime).getTime();

    if (now < deadlineMs) {
      // Sebelum deadline → reminder harian pukul 07:00 WITA (sekali per hari).
      const belumKirimHariIni = d.lastDailyReminder !== wita.date;
      if (witaHour >= DAILY_REMINDER_HOUR && belumKirimHariIni) {
        await send(sock, d.groupId, formatReminder(d));
        await deadlineStore.update(d.id, d.groupId, {
          lastDailyReminder: wita.date,
        });
      }
    } else if (now < deadlineMs + OVERDUE_WINDOW_MS) {
      // Deadline baru saja lewat (dalam 24 jam) → notif terlewat sekali.
      if (!d.remindedOverdue) {
        await send(sock, d.groupId, formatOverdue(d));
        await deadlineStore.update(d.id, d.groupId, { remindedOverdue: true });
      }
    }
    // > deadline + 24 jam → diabaikan (otomatis hilang dari list).
  }
}

async function send(sock: WASocket, jid: string, text: string): Promise<void> {
  try {
    await sock.sendMessage(jid, { text });
    console.log(`📤 Notifikasi terkirim ke ${jid}`);
  } catch (err: any) {
    console.error("Gagal mengirim notifikasi:", err?.message || err);
  }
}

/** Mulai cron job reminder (cek tiap menit). */
export function startReminderScheduler(sock: WASocket): void {
  cron.schedule("* * * * *", () => {
    checkAndSend(sock).catch((err) =>
      console.error("Scheduler error:", err?.message || err),
    );
  });
  console.log(
    `⏰ Scheduler aktif: reminder harian pukul ${DAILY_REMINDER_HOUR.toString().padStart(
      2,
      "0",
    )}:00 WITA + notif terlewat (cek tiap menit).`,
  );
}
