# 🔔 Eling Bot

> Bot WhatsApp untuk grup kuliah — reminder deadline, simpan link tugas, dan pembagian tugas kelompok via AI.

Nama **Eling** diambil dari kata Jawa/Bali _eling_ = "ingat / sadar / waspada". Tugasnya: menjaga agar tidak ada tugas yang terlewat.

## ✨ Fitur

- **🗓️ Manajemen Deadline** — tambah, lihat, tandai selesai, hapus deadline (dengan jam, zona WITA).
- **🔗 Manajemen Link** — simpan & cari link tugas (Google Docs, Canva, dll).
- **🔔 Reminder Otomatis** — H-1 jam 07.00 WITA & 3 jam sebelum deadline.
- **🧠 AI Mode** — mention bot lalu ngobrol santai; AI parsing data jadi rapi & otomatis.
- **👥 AI Task Divider** — AI membagi tugas kelompok secara adil.

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
AI_BASE_URL=https://api.groq.com/openai/v1
AI_API_KEY=
AI_MODEL=llama-3.1-8b-instant

ADMIN_NUMBER=628xxxxxxxxxx
```

- **AI Mode** aktif jika `AI_API_KEY` terisi. Tanpa key → **Command Mode** (hanya perintah `!`).
- Kompatibel dengan semua provider OpenAI-compatible (OpenAI, Gemini, Groq, Ollama, OpenRouter). Cukup ubah `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`.

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

### 🧠 Contoh AI Mode

```
@Eling ingetin tugas PBO deadline 25 Juni jam 11 malem soal design pattern
@Eling jelasin dong tugas PBO yang deadline minggu ini
@Eling bagi tugas laporan: anggota Wira, Budi, Sari, Dewi. bagian: pendahuluan,
       landasan teori, metodologi, hasil, kesimpulan, daftar pustaka
@Eling simpan pembagian ini
```

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

git clone <repo-url> && cd eling-bot
npm install && npm run build
node dist/index.js          # scan QR pertama kali

pm2 start dist/index.js --name eling-bot
pm2 save && pm2 startup
```

⚠️ Jangan upload `auth_info_baileys/`, `data/`, dan `.env` ke Git (sudah di `.gitignore`).

## 📝 Catatan

- Baileys bersifat unofficial — hindari spam agar nomor tidak terbanned.
- Reminder hanya berjalan saat bot aktif (server/komputer menyala).
- Storage awal pakai JSON lokal; bisa dimigrasi ke Notion API (roadmap v2.0).
