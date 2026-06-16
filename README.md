# Eling Bot

Bot WhatsApp untuk grup kuliah: pengingat deadline, penyimpanan link tugas, dan pembagian tugas kelompok berbantuan AI.

Nama *Eling* berasal dari bahasa Jawa/Bali yang berarti "ingat". Tujuan bot ini sederhana: memastikan tidak ada tugas yang terlewat.

## Fitur

- **Manajemen deadline** — tambah, lihat, tandai selesai, dan hapus deadline beserta jamnya (zona WITA).
- **Manajemen link** — simpan dan cari link tugas (Google Docs, Canva, dan lainnya).
- **Pengingat otomatis** — reminder harian pukul 07.00 WITA hingga deadline, dilanjutkan notifikasi saat deadline terlewat.
- **AI Mode** — pengguna cukup mention bot dengan bahasa natural; AI mengurai dan menyimpan data secara terstruktur.
- **Pembagian tugas kelompok** — AI membagi beban tugas antar anggota secara merata.
- **Isolasi per-grup** — setiap grup atau chat memiliki data dan penomoran ID sendiri.

## Teknologi

- Node.js 18+ dan TypeScript
- [Baileys](https://github.com/WhiskeySockets/Baileys) sebagai pustaka WhatsApp
- `node-cron` untuk penjadwalan pengingat
- Penyimpanan JSON lokal
- AI opsional melalui API OpenAI-compatible (OpenAI, Gemini, Groq, Ollama, OpenRouter)

## Persyaratan

- Node.js versi 18 atau lebih baru
- Nomor WhatsApp terpisah untuk bot (disarankan bukan nomor utama)
- API key dari penyedia AI yang kompatibel (opsional)

## Instalasi

```bash
# Install dependency
npm install

# Salin dan isi konfigurasi
cp .env.example .env

# Jalankan (mode pengembangan dengan auto-reload)
npm run dev

# Atau jalankan mode produksi
npm run build
npm start
```

Saat pertama dijalankan, sebuah QR Code akan muncul di terminal. Pindai dengan WhatsApp pada nomor bot. Sesi login tersimpan di direktori `auth_info_baileys/` sehingga pemindaian hanya diperlukan sekali.

## Konfigurasi

Variabel lingkungan diatur melalui berkas `.env`:

```bash
BOT_NAME=Eling

# Konfigurasi AI (opsional — kosongkan AI_API_KEY untuk Command Mode)
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_API_KEY=
AI_MODEL=gemini-2.5-flash

# Nomor admin (format internasional)
ADMIN_NUMBER=628xxxxxxxxxx

# Set ke 1 untuk log deteksi mention di grup
# DEBUG=1
```

- **AI Mode** aktif bila `AI_API_KEY` terisi. Tanpa key, bot berjalan dalam **Command Mode** (hanya merespons perintah berawalan `!`).
- Mendukung seluruh penyedia berformat OpenAI. Cukup ubah `AI_BASE_URL`, `AI_API_KEY`, dan `AI_MODEL` tanpa mengubah kode.

### Pemilihan model AI

Keandalan bot bergantung pada kemampuan *function calling* model. Model dengan dukungan kuat sangat dianjurkan:

| Model | Function calling | Catatan |
| --- | --- | --- |
| `gemini-2.5-pro` | Sangat andal | Pilihan paling stabil |
| `gemini-3-flash-preview` | Baik | Seimbang antara kecepatan dan akurasi |
| `gemini-2.5-flash` | Cukup | Sesekali tidak mengeksekusi aksi |
| `*-flash-lite`, `gemma-*` | Tidak disarankan | Sering gagal memanggil fungsi |

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `!deadline add <judul> <tanggal> <jam>` | Tambah deadline |
| `!deadline list` | Lihat deadline aktif |
| `!deadline done <id>` | Tandai deadline selesai |
| `!deadline delete <id>` | Hapus deadline |
| `!link add <label> <url>` | Simpan link |
| `!link list` | Lihat semua link |
| `!link cari <keyword>` | Cari link |
| `!link delete <id>` | Hapus link |
| `!grouptask list` | Lihat tugas kelompok |
| `!grouptask <id>` | Lihat detail tugas kelompok |
| `!grouptask delete <id>` | Hapus tugas kelompok |
| `!help` | Tampilkan bantuan |
| `!info` | Informasi bot |

Contoh: `!deadline add Tugas PBO 20 Juni 2026 23.59`

Penghapusan data hanya dapat dilakukan oleh pembuat data atau admin yang terdaftar pada `ADMIN_NUMBER`.

## Penggunaan AI Mode

Di dalam grup, mention bot terlebih dahulu. Pada chat pribadi, cukup kirim pesan tanpa mention.

```
@Eling ingatkan tugas PBO deadline 25 Juni jam 11 malam soal design pattern
@Eling jelaskan tugas PBO yang deadline minggu ini
@Eling bagi tugas laporan: anggota Wira, Budi, Sari, Dewi. bagian: pendahuluan,
       landasan teori, metodologi, hasil, kesimpulan, daftar pustaka
@Eling simpan pembagian ini
```

Format tanggal dan jam dinormalkan secara otomatis, misalnya `23.59` atau `2359` menjadi `23:59`, dan `21 Juni 2026` atau `21-06-2026` menjadi `2026-06-21`.

Catatan: jika bot menyatakan data tersimpan tetapi `!deadline list` kosong, kemungkinan model tidak memanggil fungsi. Gunakan model dengan dukungan *function calling* yang lebih baik.

## Cara kerja pengingat

- Sebelum deadline, bot mengirim pengingat ke grup setiap hari pukul 07.00 WITA hingga deadline tiba.
- Saat deadline terlewat, bot mengirim satu notifikasi "Deadline Terlewat".
- Deadline yang terlewat tetap tampil pada `!deadline list` (dengan penanda), lalu hilang otomatis 24 jam setelahnya.
- Pengingat hanya berjalan saat bot aktif. Bila bot mati pada pukul 07.00, pengingat dikirim begitu bot kembali aktif pada hari yang sama.

## Struktur proyek

```
src/
├── ai/          # Klien AI, definisi function calling, system prompt
├── commands/    # Handler perintah berawalan "!"
├── handlers/    # Router pesan, command, dan mention (AI)
├── scheduler/   # Cron job pengingat
├── storage/     # Helper penyimpanan JSON dan store
├── utils/       # Helper waktu (WITA) dan format pesan
└── index.ts     # Entry point Baileys
data/            # Penyimpanan JSON (diabaikan oleh Git)
```

## Deployment ke VPS

```bash
# Ubuntu 22.04
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

git clone https://github.com/agvswira/eling-bot-whatsapp.git
cd eling-bot-whatsapp
npm install && npm run build

# Pindai QR Code untuk pertama kali
node dist/index.js

# Jalankan sebagai service
pm2 start dist/index.js --name eling-bot
pm2 save && pm2 startup
```

Direktori `auth_info_baileys/`, `data/`, dan berkas `.env` tidak boleh diunggah ke Git. Ketiganya sudah tercantum dalam `.gitignore`.

## Catatan

- Baileys bukan pustaka resmi WhatsApp. Hindari pengiriman pesan berlebihan agar nomor tidak diblokir.
- Pengingat hanya aktif selama bot berjalan.
- Data terisolasi per-grup: deadline, link, dan tugas pada satu grup tidak terlihat di grup lain.
- Penyimpanan saat ini menggunakan JSON lokal dan dapat dimigrasikan ke basis data lain di kemudian hari.

## Lisensi

MIT
