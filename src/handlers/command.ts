import { CommandContext } from "../commands/context";
import { handleDeadline } from "../commands/deadline";
import { handleLink } from "../commands/link";
import { handleGroupTask } from "../commands/group-task";
import { handleHelp, handleInfo } from "../commands/help";

/**
 * Tangani pesan yang diawali "!". Mengembalikan teks balasan,
 * atau null jika perintah tidak dikenali (diabaikan).
 */
export async function handleCommand(
  text: string,
  ctx: CommandContext
): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed.startsWith("!")) return null;

  // Pisahkan command & argumen (hilangkan "!").
  const parts = trimmed.slice(1).split(/\s+/);
  const cmd = (parts[0] || "").toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case "deadline":
    case "dl":
      return handleDeadline(args, ctx);
    case "link":
      return handleLink(args, ctx);
    case "grouptask":
    case "gt":
    case "tugaskelompok":
      return handleGroupTask(args, ctx);
    case "help":
    case "bantuan":
    case "menu":
      return handleHelp();
    case "info":
      return handleInfo();
    default:
      // Perintah "!" tak dikenal → kasih petunjuk singkat.
      return `❓ Perintah \`!${cmd}\` tidak dikenali. Ketik \`!help\` untuk daftar perintah.`;
  }
}
