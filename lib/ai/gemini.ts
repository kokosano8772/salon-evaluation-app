import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini専用の薄いラッパー。将来Claude等へ差し替える場合は、この差し替え境界
// （lib/ai/generateGrowthSuggestions.ts が呼ぶこの関数の中身）だけを変更すればよい。
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { responseMimeType: "application/json" },
  });
}
