import { GoogleGenAI } from "@google/genai";

// Gemini専用の薄いラッパー。将来Claude等へ差し替える場合は、この差し替え境界
// （lib/ai/generateGrowthSuggestions.ts 等が呼ぶこの関数の中身）だけを変更すればよい。
//
// @google/generative-ai は2025年8月末でサポート終了(deprecated)のため、
// 後継の公式SDKである @google/genai を使用する。呼び出し側からは旧SDKの
// model.generateContent()/model.generateContentStream() と同じ形で使えるよう、
// 薄い互換ラッパーを被せている（呼び出し側の変更を避けるため）。
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export interface GeminiModelOptions {
  plainText?: boolean;
  systemInstruction?: string;
  // Google検索でグラウンディングする（ウェブ上の実際の情報を検索させる）。
  // Gemini 2.5系ではgoogleSearchツールとresponseMimeType(JSON強制)は併用不可のため、
  // 有効にした場合はplainText相当（JSON強制なし）で動作する。
  useGoogleSearch?: boolean;
  // 指定したURLの実際のページ内容（HTML/テキスト）を取得して読ませる（url_contextツール）。
  useUrlContext?: boolean;
}

function buildTools(options?: GeminiModelOptions): Record<string, object>[] | undefined {
  const tools: Record<string, object>[] = [];
  if (options?.useGoogleSearch) tools.push({ googleSearch: {} });
  if (options?.useUrlContext) tools.push({ urlContext: {} });
  return tools.length > 0 ? tools : undefined;
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenAI({ apiKey });
}

export function getGeminiModel(options?: GeminiModelOptions) {
  const ai = getClient();
  const forceJson = !options?.plainText && !options?.useGoogleSearch;

  const config = {
    systemInstruction: options?.systemInstruction,
    responseMimeType: forceJson ? "application/json" : undefined,
    tools: buildTools(options),
  };

  return {
    async generateContent(prompt: string) {
      const response = await ai.models.generateContent({ model: MODEL_NAME, contents: prompt, config });
      const text = response.text ?? "";
      return { response: { text: () => text } };
    },
    async generateContentStream(prompt: string) {
      const stream = await ai.models.generateContentStream({ model: MODEL_NAME, contents: prompt, config });
      async function* textChunks() {
        for await (const chunk of stream) {
          const text = chunk.text ?? "";
          if (text) yield { text: () => text };
        }
      }
      return { stream: textChunks() };
    },
  };
}
