import { getGeminiModel } from "@/lib/ai/gemini";
import { buildHpRankingPrompt, RankingAiResponse, RankingSiteDataForPrompt } from "./build-ranking-prompt";

const SYSTEM_INSTRUCTION =
  "あなたは美容室のWebサイトを、集客力・採用力の観点で評価する専門家です。指示された項目をクロール結果から" +
  "厳密にtrue/false判定してください。与えられていない情報を推測で補わないでください。" +
  "指定されたJSON形式以外（説明文・コードブロック記法等）は一切出力しないでください。";

// Geminiがtrue/falseを"true"/"false"の文字列で返すことがあるため救済する
// （lib/ai-check/generateAiCheckAnalysis.tsで実際に発生した不具合と同じ対策）。
function normalizeItems(raw: unknown): Record<string, boolean> {
  if (typeof raw !== "object" || raw === null) return {};
  const result: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "boolean") result[key] = value;
    else if (value === "true") result[key] = true;
    else if (value === "false") result[key] = false;
  }
  return result;
}

export async function generateHpRankingAnalysis(site: RankingSiteDataForPrompt): Promise<RankingAiResponse> {
  const model = getGeminiModel({ systemInstruction: SYSTEM_INSTRUCTION });
  const prompt = buildHpRankingPrompt(site);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("AI分析結果の形式が不正でした");
  }

  const obj = parsed as Partial<RankingAiResponse>;
  return { items: normalizeItems(obj.items) };
}
