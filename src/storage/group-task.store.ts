import { GroupTask } from "../types";
import { readJSON, writeJSON, nextId } from "./db";

const FILE = "group-tasks.json";

export async function getAll(): Promise<GroupTask[]> {
  return readJSON<GroupTask[]>(FILE, []);
}

async function saveAll(items: GroupTask[]): Promise<void> {
  await writeJSON(FILE, items);
}

export async function add(input: {
  title: string;
  members: string[];
  assignments: { member: string; tasks: string[] }[];
  createdBy: string;
  deadlineId?: number;
  groupId?: string;
}): Promise<GroupTask> {
  const all = await getAll();
  const item: GroupTask = {
    id: nextId(all),
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

export async function getById(id: number): Promise<GroupTask | undefined> {
  const all = await getAll();
  return all.find((t) => t.id === id);
}

export async function remove(id: number): Promise<GroupTask | undefined> {
  const all = await getAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  const [removed] = all.splice(idx, 1);
  await saveAll(all);
  return removed;
}
