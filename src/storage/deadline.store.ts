import { Deadline } from "../types";
import { readJSON, writeJSON, nextIdInGroup } from "./db";
import { deadlineToInstant, nowWITA } from "../utils/time";

const FILE = "deadlines.json";

// Deadline tetap tampil di list sampai H+1 (24 jam setelah waktu deadline).
const LIST_GRACE_MS = 24 * 60 * 60 * 1000;

/** Ambil SEMUA deadline lintas grup. Dipakai scheduler untuk kirim reminder. */
export async function getAllGlobal(): Promise<Deadline[]> {
  return readJSON<Deadline[]>(FILE, []);
}

async function saveAll(items: Deadline[]): Promise<void> {
  await writeJSON(FILE, items);
}

/** Semua deadline pada satu grup/chat. */
export async function getAll(groupId?: string): Promise<Deadline[]> {
  const all = await getAllGlobal();
  return all.filter((d) => d.groupId === groupId);
}

/**
 * Active = belum selesai & belum melewati H+1, pada satu grup.
 * Deadline yang sudah lewat tetap muncul (ditandai terlewat) sampai 24 jam
 * setelah waktunya, lalu otomatis hilang dari list.
 */
export async function getActive(groupId?: string): Promise<Deadline[]> {
  const items = await getAll(groupId);
  const now = Date.now();
  return items
    .filter((d) => !d.isDone)
    .filter(
      (d) =>
        now <=
        deadlineToInstant(d.dueDate, d.dueTime).getTime() + LIST_GRACE_MS,
    )
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

function sortKey(d: Deadline): string {
  return `${d.dueDate}T${d.dueTime}`;
}

export async function add(input: {
  title: string;
  dueDate: string;
  dueTime: string;
  createdBy: string;
  description?: string;
  course?: string;
  link?: string;
  groupId?: string;
}): Promise<Deadline> {
  const all = await getAllGlobal();
  // Jika dibuat pukul 07:00 WITA atau lebih, reminder harian pertama besok pagi.
  // Jika dibuat sebelum 07:00, biarkan kosong agar reminder hari ini tetap jalan.
  const now = nowWITA();
  const createdHour = Number(now.time.split(":")[0]);
  const item: Deadline = {
    id: nextIdInGroup(all, input.groupId),
    title: input.title.trim(),
    dueDate: input.dueDate,
    dueTime: input.dueTime,
    description: input.description?.trim() || undefined,
    course: input.course?.trim() || undefined,
    link: input.link?.trim() || undefined,
    isDone: false,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    groupId: input.groupId,
    lastDailyReminder: createdHour >= 7 ? now.date : undefined,
    remindedOverdue: false,
  };
  all.push(item);
  await saveAll(all);
  return item;
}

/** Cari by id dalam scope grup tertentu. */
export async function getById(
  id: number,
  groupId?: string,
): Promise<Deadline | undefined> {
  const all = await getAllGlobal();
  return all.find((d) => d.id === id && d.groupId === groupId);
}

export async function markDone(
  id: number,
  groupId?: string,
): Promise<Deadline | undefined> {
  const all = await getAllGlobal();
  const item = all.find((d) => d.id === id && d.groupId === groupId);
  if (!item) return undefined;
  item.isDone = true;
  await saveAll(all);
  return item;
}

export async function remove(
  id: number,
  groupId?: string,
): Promise<Deadline | undefined> {
  const all = await getAllGlobal();
  const idx = all.findIndex((d) => d.id === id && d.groupId === groupId);
  if (idx === -1) return undefined;
  const [removed] = all.splice(idx, 1);
  await saveAll(all);
  return removed;
}

/**
 * Update sembarang field. Dipakai scheduler untuk menandai reminder terkirim.
 * Dikunci dengan pasangan (id, groupId) agar tidak salah grup.
 */
export async function update(
  id: number,
  groupId: string | undefined,
  patch: Partial<Deadline>,
): Promise<Deadline | undefined> {
  const all = await getAllGlobal();
  const item = all.find((d) => d.id === id && d.groupId === groupId);
  if (!item) return undefined;
  Object.assign(item, patch);
  await saveAll(all);
  return item;
}
