import { Deadline } from "../types";
import { readJSON, writeJSON, nextId } from "./db";

const FILE = "deadlines.json";

export async function getAll(): Promise<Deadline[]> {
  return readJSON<Deadline[]>(FILE, []);
}

async function saveAll(items: Deadline[]): Promise<void> {
  await writeJSON(FILE, items);
}

/** Active = belum selesai. Diurutkan berdasarkan waktu deadline terdekat. */
export async function getActive(): Promise<Deadline[]> {
  const all = await getAll();
  return all
    .filter((d) => !d.isDone)
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
  const all = await getAll();
  const item: Deadline = {
    id: nextId(all),
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
    remindedH1: false,
    remindedH3: false,
  };
  all.push(item);
  await saveAll(all);
  return item;
}

export async function getById(id: number): Promise<Deadline | undefined> {
  const all = await getAll();
  return all.find((d) => d.id === id);
}

export async function markDone(id: number): Promise<Deadline | undefined> {
  const all = await getAll();
  const item = all.find((d) => d.id === id);
  if (!item) return undefined;
  item.isDone = true;
  await saveAll(all);
  return item;
}

export async function remove(id: number): Promise<Deadline | undefined> {
  const all = await getAll();
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) return undefined;
  const [removed] = all.splice(idx, 1);
  await saveAll(all);
  return removed;
}

/** Update sembarang field (dipakai scheduler untuk menandai reminder terkirim). */
export async function update(
  id: number,
  patch: Partial<Deadline>
): Promise<Deadline | undefined> {
  const all = await getAll();
  const item = all.find((d) => d.id === id);
  if (!item) return undefined;
  Object.assign(item, patch);
  await saveAll(all);
  return item;
}
