import { GroupTask } from "../types";
import { readJSON, writeJSON, nextIdInGroup } from "./db";

const FILE = "group-tasks.json";

async function getAllGlobal(): Promise<GroupTask[]> {
  return readJSON<GroupTask[]>(FILE, []);
}

async function saveAll(items: GroupTask[]): Promise<void> {
  await writeJSON(FILE, items);
}

/** Semua tugas kelompok pada satu grup/chat. */
export async function getAll(groupId?: string): Promise<GroupTask[]> {
  const all = await getAllGlobal();
  return all.filter((t) => t.groupId === groupId);
}

export async function add(input: {
  title: string;
  members: string[];
  assignments: { member: string; tasks: string[] }[];
  createdBy: string;
  deadlineId?: number;
  groupId?: string;
}): Promise<GroupTask> {
  const all = await getAllGlobal();
  const item: GroupTask = {
    id: nextIdInGroup(all, input.groupId),
    deadlineId: input.deadlineId,
    title: input.title.trim(),
    members: input.members,
    assignments: input.assignments,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString(),
    groupId: input.groupId,
  };
  all.push(item);
  await saveAll(all);
  return item;
}

export async function getById(
  id: number,
  groupId?: string,
): Promise<GroupTask | undefined> {
  const all = await getAllGlobal();
  return all.find((t) => t.id === id && t.groupId === groupId);
}

export async function remove(
  id: number,
  groupId?: string,
): Promise<GroupTask | undefined> {
  const all = await getAllGlobal();
  const idx = all.findIndex((t) => t.id === id && t.groupId === groupId);
  if (idx === -1) return undefined;
  const [removed] = all.splice(idx, 1);
  await saveAll(all);
  return removed;
}
