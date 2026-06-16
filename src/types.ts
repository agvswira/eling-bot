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
  groupId?: string; // JID grup tempat deadline dibuat (untuk reminder)
  remindedH1?: boolean; // sudah dikirim reminder H-1
  remindedH3?: boolean; // sudah dikirim reminder 3 jam sebelum
}

export interface SavedLink {
  id: number;
  label: string; // nama/keyword link
  url: string;
  addedBy: string; // nomor WA yang menambahkan
  addedAt: string;
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
