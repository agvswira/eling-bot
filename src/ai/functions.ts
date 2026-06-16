import OpenAI from "openai";
import * as deadlineStore from "../storage/deadline.store";
import * as linkStore from "../storage/link.store";
import * as groupTaskStore from "../storage/group-task.store";
import {
  formatDeadlineDetail,
  formatDeadlineList,
  formatLinkList,
  formatGroupTask,
} from "../utils/format";
import {
  isValidDate,
  isValidTime,
  normalizeDate,
  normalizeTime,
} from "../utils/time";

export interface AIContext {
  sender: string;
  groupId?: string;
  isAdmin: boolean;
}

/** Definisi fungsi (tools) yang tersedia untuk AI. */
export const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "add_deadline",
      description:
        "Tambah deadline tugas baru. Pakai saat user minta diingatkan/mencatat tugas dengan tanggal.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Nama/judul tugas, mis. 'Tugas PBO'",
          },
          dueDate: {
            type: "string",
            description: "Tanggal deadline format YYYY-MM-DD",
          },
          dueTime: {
            type: "string",
            description:
              "Jam deadline format HH:mm (24 jam). Default '23:59' jika tidak disebut.",
          },
          course: {
            type: "string",
            description: "Mata kuliah, jika disebut (opsional)",
          },
          description: {
            type: "string",
            description: "Deskripsi/detail tugas (opsional)",
          },
          link: {
            type: "string",
            description: "Link terkait tugas (opsional)",
          },
        },
        required: ["title", "dueDate", "dueTime"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_deadlines",
      description: "Tampilkan semua deadline yang masih aktif (belum selesai).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_deadline",
      description:
        "Ambil detail satu deadline berdasarkan id ATAU keyword (mis. nama mata kuliah). Pakai untuk menjawab pertanyaan tentang tugas tertentu.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "number", description: "ID deadline (opsional)" },
          keyword: {
            type: "string",
            description: "Kata kunci judul/mata kuliah (opsional)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_deadline",
      description: "Tandai sebuah deadline sebagai selesai berdasarkan id.",
      parameters: {
        type: "object",
        properties: { id: { type: "number", description: "ID deadline" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_deadline",
      description: "Hapus deadline berdasarkan id.",
      parameters: {
        type: "object",
        properties: { id: { type: "number", description: "ID deadline" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_link",
      description: "Simpan link tugas dengan label.",
      parameters: {
        type: "object",
        properties: {
          label: { type: "string", description: "Label/nama link, mis. 'PBO'" },
          url: { type: "string", description: "URL lengkap (http/https)" },
        },
        required: ["label", "url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_links",
      description: "Tampilkan semua link tersimpan.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_links",
      description: "Cari link berdasarkan keyword (cocok pada label atau url).",
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string", description: "Kata kunci pencarian" },
        },
        required: ["keyword"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_link",
      description: "Hapus link berdasarkan id.",
      parameters: {
        type: "object",
        properties: { id: { type: "number", description: "ID link" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_group_task",
      description:
        "Simpan pembagian tugas kelompok ke storage. HANYA panggil setelah user mengkonfirmasi menyimpan.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Judul tugas kelompok, mis. 'Laporan Praktikum'",
          },
          assignments: {
            type: "array",
            description: "Daftar pembagian per anggota",
            items: {
              type: "object",
              properties: {
                member: { type: "string", description: "Nama anggota" },
                tasks: {
                  type: "array",
                  items: { type: "string" },
                  description: "Bagian-bagian yang dikerjakan anggota ini",
                },
              },
              required: ["member", "tasks"],
            },
          },
          deadlineId: {
            type: "number",
            description: "ID deadline terkait (opsional)",
          },
        },
        required: ["title", "assignments"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_group_tasks",
      description: "Tampilkan semua pembagian tugas kelompok yang tersimpan.",
      parameters: { type: "object", properties: {} },
    },
  },
];

/** Eksekusi sebuah function call dari AI. Mengembalikan string hasil (untuk dikirim balik ke model). */
export async function executeFunction(
  name: string,
  args: any,
  ctx: AIContext,
): Promise<string> {
  try {
    switch (name) {
      case "add_deadline": {
        const { title, dueDate, dueTime, course, description, link } = args;
        if (!title || !String(title).trim()) {
          return "GAGAL: parameter 'title' (judul tugas) kosong. Isi judul singkat, mis. 'Resume Kasus Entrepreneurship'.";
        }
        // Normalisasi format longgar (titik, nama bulan, dll) ke kanonik.
        const normDate = isValidDate(dueDate)
          ? dueDate
          : normalizeDate(dueDate);
        const normTime = isValidTime(dueTime)
          ? dueTime
          : normalizeTime(dueTime);
        if (!normDate) {
          return `GAGAL: 'dueDate' tidak valid ("${dueDate}"). Kirim tanggal dalam format YYYY-MM-DD, mis. "2026-06-21". Judul & deskripsi sudah OK, cukup perbaiki tanggalnya.`;
        }
        if (!normTime) {
          return `GAGAL: 'dueTime' tidak valid ("${dueTime}"). Kirim jam dalam format HH:mm 24-jam, mis. "23:59". Judul & deskripsi sudah OK, cukup perbaiki jamnya.`;
        }
        const d = await deadlineStore.add({
          title,
          dueDate: normDate,
          dueTime: normTime,
          course,
          description,
          link,
          createdBy: ctx.sender,
          groupId: ctx.groupId,
        });
        return (
          "BERHASIL menyimpan deadline:\n" +
          formatDeadlineDetail(d) +
          `\n(ID: ${d.id})`
        );
      }

      case "list_deadlines": {
        const items = await deadlineStore.getActive(ctx.groupId);
        return formatDeadlineList(items);
      }

      case "get_deadline": {
        const { id, keyword } = args;
        if (id != null) {
          const d = await deadlineStore.getById(Number(id), ctx.groupId);
          return d
            ? formatDeadlineDetail(d)
            : `Tidak ada deadline dengan ID ${id}.`;
        }
        if (keyword) {
          const all = await deadlineStore.getActive(ctx.groupId);
          const q = String(keyword).toLowerCase();
          const matches = all.filter(
            (d) =>
              d.title.toLowerCase().includes(q) ||
              (d.course || "").toLowerCase().includes(q),
          );
          if (matches.length === 0)
            return `Tidak ada deadline cocok dengan "${keyword}".`;
          return matches.map(formatDeadlineDetail).join("\n\n");
        }
        return "Sebutkan id atau keyword untuk mencari deadline.";
      }

      case "complete_deadline": {
        const d = await deadlineStore.getById(Number(args.id), ctx.groupId);
        if (!d) return `Tidak ada deadline dengan ID ${args.id}.`;
        await deadlineStore.markDone(d.id, ctx.groupId);
        return `BERHASIL: deadline "${d.title}" ditandai selesai.`;
      }

      case "delete_deadline": {
        const d = await deadlineStore.getById(Number(args.id), ctx.groupId);
        if (!d) return `Tidak ada deadline dengan ID ${args.id}.`;
        if (d.createdBy !== ctx.sender && !ctx.isAdmin) {
          return "GAGAL: hanya pembuat atau admin yang boleh menghapus deadline ini.";
        }
        await deadlineStore.remove(d.id, ctx.groupId);
        return `BERHASIL: deadline "${d.title}" dihapus.`;
      }

      case "add_link": {
        const { label, url } = args;
        if (!label || !/^https?:\/\/\S+$/i.test(url || "")) {
          return "GAGAL: label wajib & url harus diawali http(s)://";
        }
        const l = await linkStore.add({
          label,
          url,
          addedBy: ctx.sender,
          groupId: ctx.groupId,
        });
        return `BERHASIL menyimpan link "${l.label}" (ID: ${l.id}).`;
      }

      case "list_links": {
        const items = await linkStore.getAll(ctx.groupId);
        return formatLinkList(items);
      }

      case "search_links": {
        const items = await linkStore.search(
          String(args.keyword || ""),
          ctx.groupId,
        );
        if (items.length === 0)
          return `Tidak ada link cocok dengan "${args.keyword}".`;
        return formatLinkList(items, `HASIL: "${args.keyword}"`);
      }

      case "delete_link": {
        const l = await linkStore.getById(Number(args.id), ctx.groupId);
        if (!l) return `Tidak ada link dengan ID ${args.id}.`;
        if (l.addedBy !== ctx.sender && !ctx.isAdmin) {
          return "GAGAL: hanya penambah atau admin yang boleh menghapus link ini.";
        }
        await linkStore.remove(l.id, ctx.groupId);
        return `BERHASIL: link "${l.label}" dihapus.`;
      }

      case "save_group_task": {
        const { title, assignments, deadlineId } = args;
        if (!title || !Array.isArray(assignments) || assignments.length === 0) {
          return "GAGAL: title & assignments (minimal 1) wajib diisi.";
        }
        const members = assignments.map((a: any) => a.member);
        const t = await groupTaskStore.add({
          title,
          members,
          assignments,
          deadlineId: deadlineId != null ? Number(deadlineId) : undefined,
          createdBy: ctx.sender,
          groupId: ctx.groupId,
        });
        return (
          `BERHASIL menyimpan pembagian tugas (ID: ${t.id}):\n` +
          formatGroupTask(t)
        );
      }

      case "list_group_tasks": {
        const items = await groupTaskStore.getAll(ctx.groupId);
        if (items.length === 0)
          return "Belum ada pembagian tugas kelompok tersimpan.";
        return items
          .map((t) => `ID ${t.id}: ${t.title} — ${t.members.join(", ")}`)
          .join("\n");
      }

      default:
        return `GAGAL: fungsi "${name}" tidak dikenali.`;
    }
  } catch (err: any) {
    console.error(`Error executing function ${name}:`, err);
    return `GAGAL menjalankan ${name}: ${err?.message || "error tak terduga"}`;
  }
}
