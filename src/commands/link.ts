import { CommandContext } from "./context";
import * as store from "../storage/link.store";
import { formatLinkList } from "../utils/format";

const USAGE =
  "🔗 *Perintah Link:*\n" +
  "`!link add <label> <url>`\n" +
  "`!link list`\n" +
  "`!link cari <keyword>`\n" +
  "`!link delete <id>`\n\n" +
  "Contoh: `!link add PBO https://docs.google.com/...`";

const URL_RE = /^https?:\/\/\S+$/i;

export async function handleLink(
  args: string[],
  ctx: CommandContext,
): Promise<string> {
  const sub = (args[0] || "").toLowerCase();
  const rest = args.slice(1);

  switch (sub) {
    case "add":
      return add(rest, ctx);
    case "list":
    case "ls":
      return list(ctx);
    case "cari":
    case "search":
    case "find":
      return cari(rest.join(" "), ctx);
    case "delete":
    case "del":
    case "hapus":
      return remove(rest[0], ctx);
    default:
      return USAGE;
  }
}

async function add(rest: string[], ctx: CommandContext): Promise<string> {
  if (rest.length < 2) {
    return "⚠️ Format: `!link add <label> <url>`\nContoh: `!link add PBO https://docs.google.com/...`";
  }
  // URL = token terakhir yang berupa http(s); label = sisanya.
  const url = rest[rest.length - 1];
  const label = rest.slice(0, -1).join(" ");
  if (!URL_RE.test(url)) {
    return "⚠️ URL tidak valid. Pastikan diawali `http://` atau `https://`.";
  }
  if (!label.trim()) {
    return "⚠️ Label tidak boleh kosong. Contoh: `!link add PBO https://...`";
  }
  const l = await store.add({
    label,
    url,
    addedBy: ctx.sender,
    groupId: ctx.groupId,
  });
  return `✅ Link tersimpan!\n🔗 *${l.label}*\n${l.url}\n\n_ID: ${l.id}_`;
}

async function list(ctx: CommandContext): Promise<string> {
  const items = await store.getAll(ctx.groupId);
  return formatLinkList(items);
}

async function cari(keyword: string, ctx: CommandContext): Promise<string> {
  if (!keyword.trim()) return "⚠️ Masukkan keyword. Contoh: `!link cari PBO`";
  const items = await store.search(keyword, ctx.groupId);
  if (items.length === 0) {
    return `🔍 Tidak ada link yang cocok dengan *"${keyword}"*.`;
  }
  return formatLinkList(items, `HASIL PENCARIAN: "${keyword}"`);
}

async function remove(
  idStr: string | undefined,
  ctx: CommandContext,
): Promise<string> {
  const id = Number(idStr);
  if (!idStr || Number.isNaN(id)) {
    return "⚠️ Sebutkan ID-nya. Contoh: `!link delete 1`";
  }
  const l = await store.getById(id);
  if (!l) return `⚠️ Link dengan ID ${id} tidak ditemukan.`;
  if (l.addedBy !== ctx.sender && !ctx.isAdmin) {
    return "🚫 Kamu hanya bisa menghapus link yang kamu tambahkan sendiri. (admin bisa hapus semua)";
  }
  await store.remove(id);
  return `🗑️ Link *"${l.label}"* dihapus.`;
}
