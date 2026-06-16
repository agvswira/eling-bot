import { SavedLink } from "../types";
import { readJSON, writeJSON, nextId } from "./db";

const FILE = "links.json";

export async function getAll(): Promise<SavedLink[]> {
  return readJSON<SavedLink[]>(FILE, []);
}

async function saveAll(items: SavedLink[]): Promise<void> {
  await writeJSON(FILE, items);
}

export async function add(input: {
  label: string;
  url: string;
  addedBy: string;
}): Promise<SavedLink> {
  const all = await getAll();
  const item: SavedLink = {
    id: nextId(all),
    label: input.label.trim(),
    url: input.url.trim(),
    addedBy: input.addedBy,
    addedAt: new Date().toISOString(),
  };
  all.push(item);
  await saveAll(all);
  return item;
}

export async function search(keyword: string): Promise<SavedLink[]> {
  const all = await getAll();
  const q = keyword.trim().toLowerCase();
  if (!q) return all;
  return all.filter(
    (l) => l.label.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
  );
}

export async function getById(id: number): Promise<SavedLink | undefined> {
  const all = await getAll();
  return all.find((l) => l.id === id);
}

export async function remove(id: number): Promise<SavedLink | undefined> {
  const all = await getAll();
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) return undefined;
  const [removed] = all.splice(idx, 1);
  await saveAll(all);
  return removed;
}
