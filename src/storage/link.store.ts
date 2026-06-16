import { SavedLink } from "../types";
import { readJSON, writeJSON, nextIdInGroup } from "./db";

const FILE = "links.json";

async function getAllGlobal(): Promise<SavedLink[]> {
  return readJSON<SavedLink[]>(FILE, []);
}

async function saveAll(items: SavedLink[]): Promise<void> {
  await writeJSON(FILE, items);
}

/** Semua link pada satu grup/chat. */
export async function getAll(groupId?: string): Promise<SavedLink[]> {
  const all = await getAllGlobal();
  return all.filter((l) => l.groupId === groupId);
}

export async function add(input: {
  label: string;
  url: string;
  addedBy: string;
  groupId?: string;
}): Promise<SavedLink> {
  const all = await getAllGlobal();
  const item: SavedLink = {
    id: nextIdInGroup(all, input.groupId),
    label: input.label.trim(),
    url: input.url.trim(),
    addedBy: input.addedBy,
    addedAt: new Date().toISOString(),
    groupId: input.groupId,
  };
  all.push(item);
  await saveAll(all);
  return item;
}

/** Cari link by keyword, dibatasi ke grup tertentu. */
export async function search(
  keyword: string,
  groupId?: string,
): Promise<SavedLink[]> {
  const items = await getAll(groupId);
  const q = keyword.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (l) => l.label.toLowerCase().includes(q) || l.url.toLowerCase().includes(q),
  );
}

export async function getById(
  id: number,
  groupId?: string,
): Promise<SavedLink | undefined> {
  const all = await getAllGlobal();
  return all.find((l) => l.id === id && l.groupId === groupId);
}

export async function remove(
  id: number,
  groupId?: string,
): Promise<SavedLink | undefined> {
  const all = await getAllGlobal();
  const idx = all.findIndex((l) => l.id === id && l.groupId === groupId);
  if (idx === -1) return undefined;
  const [removed] = all.splice(idx, 1);
  await saveAll(all);
  return removed;
}
