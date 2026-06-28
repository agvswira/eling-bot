import { isAIEnabled } from "../ai";

const BOT_NAME = process.env.BOT_NAME || "Eling";

export function handleHelp(): string {
  return (
    `🤖 *${BOT_NAME} — Bot Grup Kuliah*\n` +
    `Asisten yang bantu ingat deadline, simpan link, & bagi tugas kelompok.\n\n` +
    `*🗓️ DEADLINE*\n` +
    "`!deadline add <judul> <tanggal> <jam>`\n" +
    "`!deadline list`\n" +
    "`!deadline done <id>`\n" +
    "`!deadline delete <id>`\n\n" +
    `*🔗 LINK TUGAS*\n` +
    "`!link add <label> <url>`\n" +
    "`!link list`\n" +
    "`!link cari <keyword>`\n" +
    "`!link delete <id>`\n\n" +
    `*👥 TUGAS KELOMPOK*\n` +
    "`!grouptask list`\n" +
    "`!grouptask <id>`\n" +
    "`!grouptask delete <id>`\n\n" +
    `*ℹ️ UMUM*\n` +
    "`!help` — tampilkan bantuan ini\n" +
    "`!info` — info tentang bot\n\n" +
    (isAIEnabled()
      ? `🧠 *AI Mode aktif!* Cukup mention @${BOT_NAME} lalu ngobrol santai:\n` +
        `_"@${BOT_NAME} ingetin tugas PBO deadline 25 Juni jam 11 malem"_`
      : `⚙️ *Command Mode* — gunakan perintah diawali \`!\` di atas.`)
  );
}

export function handleInfo(): string {
  return (
    `ℹ️ *Tentang ${BOT_NAME}*\n\n` +
    `Nama *${BOT_NAME}* diambil dari kata Jawa/Bali _eling_ = "ingat / sadar / waspada".\n\n` +
    `Dibuat oleh: Komang Agus Wira Adnyana 👨‍💻\n\n` +
    `Fungsi bot: selalu mengingatkan & menjaga agar tidak ada tugas yang terlewat. 🔔\n\n` +
    `• Reminder otomatis: H-1 jam 07.00 & 3 jam sebelum deadline\n` +
    `• Penyimpanan link tugas\n` +
    `• Pembagian tugas kelompok via AI\n\n` +
    `Mode AI: ${isAIEnabled() ? "✅ Aktif" : "⚙️ Nonaktif (command mode)"}\n` +
    `Ketik \`!help\` untuk daftar perintah.`
  );
}
