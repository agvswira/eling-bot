# 🔔 Eling Bot

> Bot WhatsApp untuk grup kuliah — reminder deadline, simpan link tugas, dan pembagian tugas kelompok via AI.

Nama **Eling** diambil dari kata Jawa/Bali _eling_ = "ingat / sadar / waspada". Tugasnya: menjaga agar tidak ada tugas yang terlewat.

## ✨ Fitur

- **🗓️ Manajemen Deadline** — tambah, lihat, tandai selesai, hapus deadline (dengan jam, zona WITA).
- **🔗 Manajemen Link** — simpan & cari link tugas (Google Docs, Canva, dll).
- **🔔 Reminder Otomatis** — reminder harian tiap 07.00 WITA sampai deadline, lalu notif "terlewat".
- **🧠 AI Mode** — mention bot lalu ngobrol santai; AI parsing data jadi rapi & otomatis.
- **👥 AI Task Divider** — AI membagi tugas kelompok secara adil.
- **🔒 Isolasi Per-Grup** — tiap grup/chat punya data & ID sendiri, tidak tercampur antar grup.

## 🚀 Mulai Cepat

```bash
# 1. Install dependency
npm install

# 2. Salin konfigurasi
cp .env.example .env
# lalu isi .env (lihat di bawah)

# 3a. Mode development (auto-reload)
npm run dev

# 3b. Mode production
npm run build
npm start
```

Saat pertama jalan, **scan QR Code** yang muncul di terminal dengan WhatsApp nomor bot (disarankan nomor cadangan). Sesi tersimpan di `auth_info_baileys/`.

## ⚙️ Konfigurasi `.env`

```bash
BOT_NAME=Eling

# AI (opsional — kosongkan AI_API_KEY untuk Command Mode)
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_API_KEY=
AI_MODEL=gemini-2.5-flash

ADMIN_NUMBER=628xxxxxxxxxx

# Opsional: DEBUG=1 untuk log deteksi mention di grup
# DEBUG=1
```

- **AI Mode** aktif jika `AI_API_KEY` terisi. Tanpa key → **Command Mode** (hanya perintah `!`).
- Kompatibel dengan semua provider OpenAI-compatible (OpenAI, Gemini, Groq, Ollama, OpenRouter). Cukup ubah `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` — kode tidak perlu diubah.

### 🤖 Rekomendasi Model AI

Keandalan bot bergantung pada kemampuan **function calling** model. Disarankan model yang kuat:

| Model | Function calling | Catatan |
| --- | --- | --- |
| `gemini-2.5-pro` | ⭐ Sangat andal | Pilihan teraman |
| `gemini-3-flash-preview` | ✅ Bagus | Seimbang (cepat + pintar) |
| `gemini-2.5-flash` | ⚠️ Cukup | Kadang "ngobrol doang" tanpa eksekusi |
| `*-flash-lite`, `gemma-*` | ❌ Hindari | Sering gagal panggil fungsi |

## 🔔 Cara Kerja Reminder

- **Sebelum deadline:** bot kirim reminder ke grup **tiap hari pukul 07.00 WITA**, berulang sampai deadline tiba.
- **Saat deadline lewat:** bot kirim notif **"⛔ DEADLINE TERLEWAT!"** satu kali.
- **Di `!deadline list`:** tugas yang lewat tetap tampil (ditandai ⚠️), lalu **otomatis hilang H+1** (24 jam setelah deadline).
- Reminder hanya jalan saat bot aktif. Kalau bot mati pas 07.00, reminder menyusul begitu bot nyala lagi di hari yang sama.

## 💬 Perintah

| Perintah | Fungsi |
| --- | --- |
| `!deadline add <judul> <tanggal> <jam>` | Tambah deadline |
| `!deadline list` | Lihat deadline aktif |
| `!deadline done <id>` | Tandai selesai |
| `!deadline delete <id>` | Hapus deadline |
| `!link add <label> <url>` | Simpan link |
| `!link list` | Lihat semua link |
| `!link cari <keyword>` | Cari link |
| `!link delete <id>` | Hapus link |
| `!grouptask list` | Lihat tugas kelompok |
| `!grouptask <id>` | Detail tugas kelompok |
| `!grouptask delete <id>` | Hapus tugas kelompok |
| `!help` | Bantuan |
| `!info` | Info bot |

Contoh: `!deadline add Tugas PBO 20 Juni 2026 23.59`

> Hanya **pembuat data** atau **admin** (`ADMIN_NUMBER`) yang bisa menghapus sebuah data.

### 🧠 Contoh AI Mode

Di **grup**, mention/tag bot dulu. Di **chat pribadi (DM)**, cukup kirim pesan biasa tanpa mention.

```
@Eling ingetin tugas PBO deadline 25 Juni jam 11 malem soal design pattern
@Eling jelasin dong tugas PBO yang deadline minggu ini
@Eling bagi tugas laporan: anggota Wira, Budi, Sari, Dewi. bagian: pendahuluan,
       landasan teori, metodologi, hasil, kesimpulan, daftar pustaka
@Eling simpan pembagian ini
```

Input tanggal/jam fleksibel — AI & parser otomatis menormalkan: `23.59` / `2359` → `23:59`, `21 Juni 2026` / `21-06-2026` → `2026-06-21`.

> 💡 Cek cepat: kalau AI bilang "sudah dicatat" tapi `!deadline list` kosong, berarti model tidak memanggil fungsi — ganti ke model dengan function calling lebih kuat (lihat tabel di atas).

## 📁 Struktur Project

```
src/
├── ai/          # client OpenAI, function calling, system prompt
├── commands/    # handler perintah "!"
├── handlers/    # router pesan, command, mention (AI)
├── scheduler/   # cron reminder
├── storage/     # JSON storage helper + stores
├── utils/       # helper waktu (WITA) & format pesan
└── index.ts     # entry point Baileys
data/            # JSON storage (gitignored)
```

## 🖥️ Deploy ke VPS (ringkas)

```bash
# di VPS (Ubuntu 22.04)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

git clone https://github.com/agvswira/eling-bot-whatsapp.git && cd eling-bot-whatsapp
npm install && npm run build
node dist/index.js          # scan QR pertama kali

pm2 start dist/index.js --name eling-bot
pm2 save && pm2 startup
```

⚠️ Jangan upload `auth_info_baileys/`, `data/`, dan `.env` ke Git (sudah di `.gitignore`).

## 📝 Catatan

- Baileys bersifat unofficial — hindari spam agar nomor tidak terbanned.
- Reminder hanya berjalan saat bot aktif (server/komputer menyala).
- Data terisolasi per-grup: deadline/link/tugas di Grup A tidak terlihat di Grup B.
- Storage awal pakai JSON lokal; bisa dimigrasi ke Notion API (roadmap v2.0).
