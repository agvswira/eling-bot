import OpenAI from "openai";

const apiKey = process.env.AI_API_KEY?.trim();
const baseURL = process.env.AI_BASE_URL?.trim();

const enabled = !!apiKey;

export const ai: OpenAI | null = enabled
  ? new OpenAI({
      baseURL: baseURL || undefined,
      apiKey,
    })
  : null;

export const AI_MODEL = process.env.AI_MODEL?.trim() || "gpt-4o-mini";

export function isAIEnabled(): boolean {
  return enabled;
}

export function logAIMode(): void {
  if (enabled) {
    console.log(`✅ AI Mode aktif: ${baseURL || "https://api.openai.com/v1"} (model: ${AI_MODEL})`);
  } else {
    console.log("⚙️ Command Mode aktif (tidak ada API key)");
  }
}
