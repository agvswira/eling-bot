import { promises as fs } from "fs";
import { existsSync, mkdirSync } from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(fileName: string): string {
  return path.join(DATA_DIR, fileName);
}

/**
 * Read a JSON file from the data directory.
 * Returns `fallback` if the file does not exist or is empty/corrupt.
 */
export async function readJSON<T>(fileName: string, fallback: T): Promise<T> {
  ensureDataDir();
  const fp = filePath(fileName);
  try {
    const raw = await fs.readFile(fp, "utf-8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch (err: any) {
    if (err?.code === "ENOENT") return fallback;
    console.error(
      `⚠️ Gagal membaca ${fileName}, memakai nilai default:`,
      err?.message,
    );
    return fallback;
  }
}

/**
 * Write a JSON file to the data directory (pretty-printed).
 * Uses an atomic write via a temp file to reduce corruption risk.
 */
export async function writeJSON<T>(fileName: string, data: T): Promise<void> {
  ensureDataDir();
  const fp = filePath(fileName);
  const tmp = `${fp}.tmp`;
  const payload = JSON.stringify(data, null, 2);
  await fs.writeFile(tmp, payload, "utf-8");
  await fs.rename(tmp, fp);
}

/** Compute the next incremental id for a list of records. */
export function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

/**
 * Compute the next incremental id scoped to a single group/chat.
 * ID berurut per-grup (tiap grup mulai dari 1), supaya UX rapi.
 */
export function nextIdInGroup(
  items: { id: number; groupId?: string }[],
  groupId?: string,
): number {
  return (
    items
      .filter((item) => item.groupId === groupId)
      .reduce((max, item) => Math.max(max, item.id), 0) + 1
  );
}
