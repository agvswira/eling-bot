import { CommandContext } from "./context";
import * as store from "../storage/deadline.store";
import { parseDeadlineInput } from "../utils/time";
import { formatDeadlineList, formatDeadlineDetail } from "../utils/format";

const USAGE =
  "📋 *Perintah Deadline:*\n" +
  "`!deadline add <judul> <tanggal> <jam>`\n" +
  "`!deadline list`\n" +
  "`!deadline done <id>`\n" +
  "`!deadline delete <id>`\n\n" +
  "Contoh: `!deadline add Tugas PBO 20 Juni 2026 23.59`";

export async function handleDeadline(
  args: string[],
  ctx: CommandContext,
): Promise<string> {
  const sub = (args[0] || "").toLowerCase();
  const rest = args.slice(1);

  switch (sub) {
    case "add":
      return add(rest.join(" "), ctx);
    case "list":
    case "ls":
      return list(ctx);
    case "done":
    case "selesai":
      return done(rest[0], ctx);
    case "delete":
    case "del":
    case "hapus":
      return remove(rest[0], ctx);
    default:
      return USAGE;
  }
}

async function add(input: string, ctx: CommandContext): Promise<string> {
  if (!input.trim()) return USAGE;
  const parsed = parseDeadlineInput(input);
  if (!parsed) {
    return (
      "⚠️ Format tanggal/jam tidak dikenali.\n\n" +
      "Gunakan salah satu:\n" +
      "• `Tugas PBO 20 Juni 2026 23.59`\n" +
      "• `Tugas PBO 25-06-2026 23:59`\n" +
      "• `Tugas PBO 2026-06-25 23:59`"
    );
  }
  const d = await store.add({
    title: parsed.title,
    dueDate: parsed.dueDate,
    dueTime: parsed.dueTime,
    createdBy: ctx.sender,
    groupId: ctx.groupId,
  });
  return (
    `✅ Deadline tersimpan!\n\n` + formatDeadlineDetail(d) + `\n\n_ID: ${d.id}_`
  );
}

async function list(ctx: CommandContext): Promise<string> {
  const items = await store.getActive(ctx.groupId);
  return formatDeadlineList(items);
}

async function done(
  idStr: string | undefined,
  ctx: CommandContext,
): Promise<string> {
  const id = Number(idStr);
  if (!idStr || Number.isNaN(id)) {
    return "⚠️ Sebutkan ID-nya. Contoh: `!deadline done 1`";
  }
  const d = await store.getById(id, ctx.groupId);
  if (!d) return `⚠️ Deadline dengan ID ${id} tidak ditemukan.`;
  await store.markDone(id, ctx.groupId);
  return `✅ Deadline *"${d.title}"* ditandai selesai. Mantap! 🎉`;
}

async function remove(
  idStr: string | undefined,
  ctx: CommandContext,
): Promise<string> {
  const id = Number(idStr);
  if (!idStr || Number.isNaN(id)) {
    return "⚠️ Sebutkan ID-nya. Contoh: `!deadline delete 1`";
  }
  const d = await store.getById(id, ctx.groupId);
  if (!d) return `⚠️ Deadline dengan ID ${id} tidak ditemukan.`;
  // Hanya pembuat atau admin yang boleh hapus.
  if (d.createdBy !== ctx.sender && !ctx.isAdmin) {
    return "🚫 Kamu hanya bisa menghapus deadline yang kamu buat sendiri. (admin bisa hapus semua)";
  }
  await store.remove(id, ctx.groupId);
  return `🗑️ Deadline *"${d.title}"* dihapus.`;
}
