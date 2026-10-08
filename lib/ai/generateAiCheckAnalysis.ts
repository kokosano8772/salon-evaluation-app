// 美容室AI対策診断（Salon AI Check）のAI分析呼び出し。
// JSON出力を期待する（gemini.tsのデフォルト挙動＝plainText/useGoogleSearch未指定時はJSON強制）。

import { getGeminiModel } from "./gemini";
import { AiCheckAiResponse, buildAiCheckPrompt, SiteDataForPrompt } from "@/lib/ai-check/build-ai-check-prompt";

const SYSTEM_INSTRUCTION =
  "あなたは美容室のWebサイトを、AI検索（ChatGPT等の対話型AIにおすすめ候補として紹介されやすいか）の" +
  "観点で診断する専門家です。与えられた情報のみを根拠に判定し、無い情報を推測で補わないでください。" +
  "指定されたJSON形式以外（説明文・コードブロック記法等）は一切出力しないでください。";

export async function generateAiCheckAnalysis(site: SiteDataForPrompt): Promise<AiCheckAiResponse> {
  const model = getGeminiModel({ systemInstruction: SYSTEM_INSTRUCTION });
  const prompt = buildAiCheckPrompt(site);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("AI分析結果の形式が不正でした");
  }

  const obj = parsed as Partial<AiCheckAiResponse>;
  if (!obj.items || typeof obj.items !== "object") {
    throw new Error("AI分析結果にitemsが含まれていません");
  }

  return {
    items: obj.items,
    summary: obj.summary ?? "",
    target: obj.target ?? "",
    strengths: Array.isArray(obj.strengths) ? obj.strengths : [],
    weaknesses: Array.isArray(obj.weaknesses) ? obj.weaknesses : [],
    missingInformation: Array.isArray(obj.missingInformation) ? obj.missingInformation : [],
    recommendations: Array.isArray(obj.recommendations) ? obj.recommendations : [],
  };
}
