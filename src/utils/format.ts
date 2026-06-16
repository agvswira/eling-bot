import { Deadline, SavedLink, GroupTask } from "../types";
import { formatTanggalIndo, sisaWaktu } from "./time";

/** Satu baris ringkas deadline untuk list. */
export function formatDeadlineLine(d: Deadline): string {
  const status = d.isDone ? "✅" : "📌";
  const course = d.course ? ` [${d.course}]` : "";
  return (
    `${status} *${d.id}.* ${d.title}${course}\n` +
    `   ⏰ ${formatTanggalIndo(d.dueDate)} pukul ${d.dueTime} WITA` +
    (d.isDone ? "" : `\n   ⏳ ${sisaWaktu(d.dueDate, d.dueTime)}`)
  );
}

/** Daftar deadline aktif. */
export function formatDeadlineList(items: Deadline[]): string {
  if (items.length === 0) {
    return "📭 Belum ada deadline aktif. Tambah dengan:\n`!deadline add <judul> <tanggal> <jam>`";
  }
  const body = items.map(formatDeadlineLine).join("\n\n");
  return `🗓️ *DAFTAR DEADLINE AKTIF*\n\n${body}`;
}

/** Detail deadline lengkap (dipakai AI tanya tugas). */
export function formatDeadlineDetail(d: Deadline): string {
  const lines: string[] = [];
  const judul = d.course ? `${d.course} — ${d.title}` : d.title;
  lines.push(`📚 *${judul}*`);
  lines.push(`⏰ Deadline: ${formatTanggalIndo(d.dueDate)}, pukul ${d.dueTime} WITA`);
  if (d.description) lines.push(`📝 Deskripsi: ${d.description}`);
  if (d.link) lines.push(`🔗 Link: ${d.link}`);
  if (!d.isDone) lines.push(`⏳ Sisa waktu: ${sisaWaktu(d.dueDate, d.dueTime)}`);
  else lines.push(`✅ Status: Selesai`);
  return lines.join("\n");
}

/** Reminder deadline (sesuai format spec). */
export function formatReminder(d: Deadline): string {
  return (
    `🔔 *REMINDER DEADLINE!*\n` +
    `📌 Tugas: ${d.title}${d.course ? ` (${d.course})` : ""}\n` +
    `⏰ Deadline: ${formatTanggalIndo(d.dueDate)} pukul ${d.dueTime} WITA\n` +
    `⏳ Sisa waktu: ${sisaWaktu(d.dueDate, d.dueTime)}`
  );
}

/** Satu link untuk list. */
export function formatLinkLine(l: SavedLink): string {
  return `🔗 *${l.id}.* ${l.label}\n   ${l.url}`;
}

export function formatLinkList(items: SavedLink[], title = "DAFTAR LINK TERSIMPAN"): string {
  if (items.length === 0) {
    return "📭 Belum ada link tersimpan. Tambah dengan:\n`!link add <label> <url>`";
  }
  const body = items.map(formatLinkLine).join("\n\n");
  return `🔗 *${title}*\n\n${body}`;
}

/** Pembagian tugas kelompok. */
export function formatGroupTask(t: GroupTask): string {
  const lines: string[] = [];
  lines.push(`✅ *Pembagian tugas: ${t.title}*`);
  lines.push("");
  const maxLen = Math.max(...t.assignments.map((a) => a.member.length), 0);
  for (const a of t.assignments) {
    const name = a.member.padEnd(maxLen, " ");
    lines.push(`👤 ${name} → ${a.tasks.join(" + ")}`);
  }
  return lines.join("\n");
}

export function formatGroupTaskList(items: GroupTask[]): string {
  if (items.length === 0) {
    return "📭 Belum ada pembagian tugas kelompok tersimpan.";
  }
  const body = items
    .map((t) => `*${t.id}.* ${t.title} (${t.members.length} anggota)`)
    .join("\n");
  return `👥 *DAFTAR TUGAS KELOMPOK*\n\n${body}\n\nLihat detail: \`!grouptask <id>\``;
}
