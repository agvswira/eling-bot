import OpenAI from "openai";
import { ai, AI_MODEL, isAIEnabled } from "../ai";
import { buildSystemPrompt } from "../ai/prompt";
import { tools, executeFunction, AIContext } from "../ai/functions";

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const MAX_HISTORY = 12; // jumlah pesan user+assistant yang disimpan per grup
const MAX_TOOL_ROUNDS = 5; // batas iterasi function calling agar tidak loop

// Riwayat percakapan ringkas per chat (groupId atau sender).
const histories = new Map<string, ChatMessage[]>();

function getHistory(key: string): ChatMessage[] {
  if (!histories.has(key)) histories.set(key, []);
  return histories.get(key)!;
}

function pushHistory(key: string, msg: ChatMessage): void {
  const h = getHistory(key);
  h.push(msg);
  // Pangkas agar tidak membengkak (sisakan pasangan terbaru).
  while (h.length > MAX_HISTORY) h.shift();
}

/**
 * Proses pesan natural (bot di-mention). Mengembalikan teks balasan.
 */
export async function handleMention(
  text: string,
  ctx: AIContext,
): Promise<string> {
  if (!isAIEnabled() || !ai) {
    return "🤖 Maaf, AI Mode sedang nonaktif. Gunakan perintah diawali `!` ya. Ketik `!help`.";
  }

  const cleaned = text.trim();
  if (!cleaned) {
    return "Hai! 👋 Ada yang bisa aku bantu soal tugas atau deadline?";
  }

  const key = ctx.groupId || ctx.sender;
  const history = getHistory(key);

  const messages: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(ctx.isAdmin) },
    ...history,
    { role: "user", content: cleaned },
  ];

  try {
    let finalText = "";

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const completion = await ai.chat.completions.create({
        model: AI_MODEL,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.4,
      });

      const choice = completion.choices[0];
      const msg = choice.message;

      // Tambahkan jawaban assistant ke konteks loop.
      messages.push(msg as ChatMessage);

      const toolCalls = msg.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        finalText = msg.content?.trim() || "";
        break;
      }

      // Jalankan setiap tool call lalu kirim hasilnya balik ke model.
      for (const call of toolCalls) {
        if (call.type !== "function") continue;
        let parsedArgs: any = {};
        try {
          parsedArgs = call.function.arguments
            ? JSON.parse(call.function.arguments)
            : {};
        } catch {
          parsedArgs = {};
        }
        const result = await executeFunction(
          call.function.name,
          parsedArgs,
          ctx,
        );
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: result,
        });
      }
    }

    if (!finalText) {
      finalText = "✅ Beres! (tidak ada balasan teks dari AI)";
    }

    // Simpan ke riwayat (hanya teks user & jawaban akhir, supaya ringkas).
    pushHistory(key, { role: "user", content: cleaned });
    pushHistory(key, { role: "assistant", content: finalText });

    return finalText;
  } catch (err: any) {
    console.error("AI error:", err?.message || err);
    return (
      "⚠️ Maaf, lagi ada kendala menghubungi AI. " +
      "Coba lagi sebentar, atau pakai perintah `!` (ketik `!help`)."
    );
  }
}
