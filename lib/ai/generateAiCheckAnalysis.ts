// 美容室AI対策診断（Salon AI Check・プロ版）のAI分析呼び出し。
// ルールベース＋クイズ回答で確定済みの項目（48点分）を渡し、AIにはクロール内容から
// 判定可能な残り24項目（AI_JUDGED_ITEMS、52点分）のtrue/false判定と、それを踏まえた
// コメント文章の生成を1回でまとめて行わせる（JSON出力を期待する。gemini.tsのデフォルト
// 挙動＝plainText/useGoogleSearch未指定時はJSON強制）。

import { getGeminiModel } from "./gemini";
import { AiCheckAiResponse, buildAiCheckPrompt, SiteDataForPrompt } from "@/lib/ai-check/build-ai-check-prompt";
import { DiagnosisItem } from "@/lib/ai-check/types";

// Geminiがtrue/falseを"true"/"false"の文字列で返すことがあるため、boolean
// として厳密に扱いつつ文字列表現も救済する（それ以外の値はbuildAiJudgedDiagnosisItems側で
// unknown扱いになる）。
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

const SYSTEM_INSTRUCTION =
  "あなたは美容室のWebサイトを、AI検索（ChatGPT等の対話型AIにおすすめ候補として紹介されやすいか）の" +
  "観点で診断する専門家です。指示された項目をクロール結果から厳密にtrue/false判定し、その判定結果と" +
  "確定済みの情報だけを根拠にコメントを生成してください。与えられていない情報を推測で補わないでください。" +
  "指定されたJSON形式以外（説明文・コードブロック記法等）は一切出力しないでください。";

export async function generateAiCheckAnalysis(
  site: SiteDataForPrompt,
  partialItems: DiagnosisItem[]
): Promise<AiCheckAiResponse> {
  const model = getGeminiModel({ systemInstruction: SYSTEM_INSTRUCTION });
  const prompt = buildAiCheckPrompt(site, partialItems);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("AI分析結果の形式が不正でした");
  }

  const obj = parsed as Partial<AiCheckAiResponse>;

  return {
    items: normalizeItems(obj.items),
    summary: obj.summary ?? "",
    target: obj.target ?? "",
    strengths: Array.isArray(obj.strengths) ? obj.strengths : [],
    weaknesses: Array.isArray(obj.weaknesses) ? obj.weaknesses : [],
    missingInformation: Array.isArray(obj.missingInformation) ? obj.missingInformation : [],
    recommendations: Array.isArray(obj.recommendations) ? obj.recommendations : [],
    salonName: obj.salonName ?? "",
    suggestedSearchQueries: Array.isArray(obj.suggestedSearchQueries) ? obj.suggestedSearchQueries : [],
  };
}
