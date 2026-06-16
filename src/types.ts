export interface Deadline {
  id: number;
  title: string; // nama tugas
  dueDate: string; // format: YYYY-MM-DD
  dueTime: string; // format: HH:mm — WAJIB diisi, contoh: "23:59" atau "00:00"
  description?: string; // deskripsi tugas (opsional, biasanya diisi via AI)
  course?: string; // mata kuliah (opsional)
  link?: string; // link terkait (opsional)
  isDone: boolean;
  createdBy: string; // nomor WA yang menambahkan
  createdAt: string;
  groupId?: string; // JID chat (grup/DM) asal — untuk isolasi data & target reminder
  lastDailyReminder?: string; // tanggal WITA (YYYY-MM-DD) terakhir kirim reminder harian
  remindedOverdue?: boolean; // sudah kirim notifikasi "deadline terlewat"
}

export interface SavedLink {
  id: number;
  label: string; // nama/keyword link
  url: string;
  addedBy: string; // nomor WA yang menambahkan
  addedAt: string;
  groupId?: string; // JID chat (grup/DM) tempat link disimpan — untuk isolasi data
}

export interface GroupTask {
  id: number;
  deadlineId?: number; // relasi ke deadline jika ada
  title: string; // nama tugas kelompok
  members: string[]; // nama anggota
  assignments: {
    member: string;
    tasks: string[]; // bagian yang dikerjakan
  }[];
  createdBy: string;
  createdAt: string;
  groupId?: string;
}
