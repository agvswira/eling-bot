/**
 * Helper waktu untuk zona WITA (UTC+8).
 *
 * Catatan penting: seluruh `dueDate`/`dueTime` disimpan sebagai jam dinding
 * WITA. Untuk membandingkan dengan "sekarang" kita konversi ke instant UTC
 * absolut memakai offset +8 jam.
 */

export const WITA_OFFSET_HOURS = 8;
const WITA_OFFSET_MS = WITA_OFFSET_HOURS * 60 * 60 * 1000;

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Index bulan (1-12) dari nama bulan Indonesia/Inggris, atau null. */
function monthIndex(name: string): number | null {
  const n = name.trim().toLowerCase();
  const map: Record<string, number> = {
    jan: 1, januari: 1, january: 1,
    feb: 2, februari: 2, february: 2,
    mar: 3, maret: 3, march: 3,
    apr: 4, april: 4,
    mei: 5, may: 5,
    jun: 6, juni: 6, june: 6,
    jul: 7, juli: 7, july: 7,
    agu: 8, agustus: 8, agt: 8, aug: 8, august: 8,
    sep: 9, september: 9, sept: 9,
    okt: 10, oktober: 10, oct: 10, october: 10,
    nov: 11, november: 11,
    des: 12, desember: 12, dec: 12, december: 12,
  };
  return map[n] ?? null;
}

/** Instant UTC absolut dari deadline (jam dinding WITA). */
export function deadlineToInstant(dueDate: string, dueTime: string): Date {
  const [y, mo, d] = dueDate.split("-").map(Number);
  const [hh, mm] = dueTime.split(":").map(Number);
  // WITA = UTC+8 → kurangi offset agar dapat instant UTC.
  return new Date(Date.UTC(y, mo - 1, d, hh - WITA_OFFSET_HOURS, mm, 0, 0));
}

/** Waktu reminder H-1 pukul 07:00 WITA (instant UTC). */
export function reminderH1Instant(dueDate: string): Date {
  const [y, mo, d] = dueDate.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d - 1, 7 - WITA_OFFSET_HOURS, 0, 0, 0));
}

/** Waktu reminder 3 jam sebelum deadline (instant UTC). */
export function reminderH3Instant(dueDate: string, dueTime: string): Date {
  const dl = deadlineToInstant(dueDate, dueTime);
  return new Date(dl.getTime() - 3 * 60 * 60 * 1000);
}

/** Tanggal/jam sekarang sebagai jam dinding WITA (untuk prompt AI & display). */
export function nowWITA(): {
  date: string;
  time: string;
  pretty: string;
} {
  const now = new Date(Date.now() + WITA_OFFSET_MS);
  const y = now.getUTCFullYear();
  const mo = now.getUTCMonth();
  const d = now.getUTCDate();
  const hh = now.getUTCHours();
  const mm = now.getUTCMinutes();
  const dateStr = `${y}-${pad(mo + 1)}-${pad(d)}`;
  const timeStr = `${pad(hh)}:${pad(mm)}`;
  return {
    date: dateStr,
    time: timeStr,
    pretty: `${d} ${MONTHS_ID[mo]} ${y}, pukul ${timeStr} WITA`,
  };
}

/** Format "2026-06-20" → "20 Juni 2026". */
export function formatTanggalIndo(dueDate: string): string {
  const [y, mo, d] = dueDate.split("-").map(Number);
  return `${d} ${MONTHS_ID[mo - 1]} ${y}`;
}

/**
 * Sisa waktu menuju deadline dalam bahasa manusia.
 * Contoh: "3 jam lagi", "besok", "5 hari lagi", "sudah lewat".
 */
export function sisaWaktu(dueDate: string, dueTime: string): string {
  const target = deadlineToInstant(dueDate, dueTime).getTime();
  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) return "sudah lewat ⛔";

  const diffMin = Math.round(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 60) return `${diffMin} menit lagi`;
  if (diffHour < 24) {
    const sisaMenit = Math.round((diffMs - diffHour * 3_600_000) / 60000);
    return sisaMenit > 0 ? `${diffHour} jam ${sisaMenit} menit lagi` : `${diffHour} jam lagi`;
  }
  if (diffDay === 1) return "besok";
  return `${diffDay} hari lagi`;
}

export interface ParsedDeadline {
  title: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
}

/**
 * Parse input command "!deadline add" yang fleksibel. Mendukung:
 *   - "Tugas PBO 20 Juni 2026 23.59"
 *   - "Tugas PBO 25-06-2026 23:59"
 *   - "Tugas PBO 2026-06-25 23:59"
 * Jam boleh memakai "." atau ":". Jika jam tidak ada, default 23:59.
 */
export function parseDeadlineInput(raw: string): ParsedDeadline | null {
  const text = raw.trim();
  if (!text) return null;

  // 1) Nama bulan: "<judul> 20 Juni 2026 [23.59]"
  let m = text.match(
    /^(.*?)\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:\s+(\d{1,2})[:.](\d{1,2}))?$/
  );
  if (m) {
    const month = monthIndex(m[3]);
    if (month) {
      return build(m[1], +m[4], month, +m[2], m[5], m[6]);
    }
  }

  // 2) Numerik DMY: "<judul> 25-06-2026 [23:59]"
  m = text.match(
    /^(.*?)\s+(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2})[:.](\d{1,2}))?$/
  );
  if (m) {
    return build(m[1], +m[4], +m[3], +m[2], m[5], m[6]);
  }

  // 3) ISO: "<judul> 2026-06-25 [23:59]"
  m = text.match(
    /^(.*?)\s+(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2})[:.](\d{1,2}))?$/
  );
  if (m) {
    return build(m[1], +m[2], +m[3], +m[4], m[5], m[6]);
  }

  return null;
}

function build(
  title: string,
  year: number,
  month: number,
  day: number,
  hourRaw?: string,
  minRaw?: string
): ParsedDeadline | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const hh = hourRaw != null ? Number(hourRaw) : 23;
  const mm = minRaw != null ? Number(minRaw) : 59;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  const t = title.trim();
  if (!t) return null;
  return {
    title: t,
    dueDate: `${year}-${pad(month)}-${pad(day)}`,
    dueTime: `${pad(hh)}:${pad(mm)}`,
  };
}

/** Validasi sederhana format YYYY-MM-DD. */
export function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/** Validasi sederhana format HH:mm. */
export function isValidTime(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}
