import { CommandContext } from "./context";
import * as store from "../storage/group-task.store";
import { formatGroupTask, formatGroupTaskList } from "../utils/format";

const USAGE =
  "👥 *Perintah Tugas Kelompok:*\n" +
  "`!grouptask list`\n" +
  "`!grouptask <id>` — lihat detail\n" +
  "`!grouptask delete <id>`\n\n" +
  "💡 Pembagian tugas otomatis dibuat lewat AI. Mention bot lalu sebut anggota & bagian tugasnya.";

export async function handleGroupTask(
  args: string[],
  ctx: CommandContext
): Promise<string> {
  const sub = (args[0] || "").toLowerCase();
  const rest = args.slice(1);

  switch (sub) {
    case "":
    case "list":
    case "ls":
      return list();
    case "delete":
    case "del":
    case "hapus":
      return remove(rest[0], ctx);
    default: {
      // "!grouptask 2" → tampilkan detail by id
      const id = Number(sub);
      if (!Number.isNaN(id)) return detail(id);
      return USAGE;
    }
  }
}

async function list(): Promise<string> {
  const items = await store.getAll();
  return formatGroupTaskList(items);
}

async function detail(id: number): Promise<string> {
  const t = await store.getById(id);
  if (!t) return `⚠️ Tugas kelompok dengan ID ${id} tidak ditemukan.`;
  return formatGroupTask(t) + `\n\n_Dibuat oleh: ${t.createdBy}_`;
}

async function remove(idStr: string | undefined, ctx: CommandContext): Promise<string> {
  const id = Number(idStr);
  if (!idStr || Number.isNaN(id)) {
    return "⚠️ Sebutkan ID-nya. Contoh: `!grouptask delete 1`";
  }
  const t = await store.getById(id);
  if (!t) return `⚠️ Tugas kelompok dengan ID ${id} tidak ditemukan.`;
  if (t.createdBy !== ctx.sender && !ctx.isAdmin) {
    return "🚫 Kamu hanya bisa menghapus tugas kelompok yang kamu buat sendiri. (admin bisa hapus semua)";
  }
  await store.remove(id);
  return `🗑️ Tugas kelompok *"${t.title}"* dihapus.`;
}
