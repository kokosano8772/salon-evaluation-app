// チャットボットのAIが「情報がございません」と答えた質問を、FAQ拡充のヒントとして
// 記録する前にGeminiで分類する。生の質問文をそのまま保存しない方針
// （chatbot_unanswered_questionsのコメント参照）のため、ここで作る短い要約・
// カテゴリだけを呼び出し元が保存する。
//
// 求人・採用に無関係、またはアダルト・暴言・嫌がらせ等の不適切な内容は
// shouldLog:falseを返し、呼び出し元は一切保存しない（スタッフの目に触れさせない）。
import { getGeminiModel } from "./gemini";

export interface UnansweredQuestionClassification {
  shouldLog: boolean;
  category: string;
  summary: string;
}

const SYSTEM_INSTRUCTION =
  "あなたは美容室の求人チャットボットの運用担当者向けに、回答できなかった質問を仕分けるアシスタントです。";

function buildPrompt(question: string): string {
  return `次の質問は、美容室の求人チャットボットが「情報がございません」と答えられなかった質問です。

質問: ${question}

以下のJSON形式のみで回答してください。前置きや説明、マークダウンのコードブロックは一切付けないこと。
{
  "shouldLog": boolean,
  "category": "string（例: 給与, 勤務時間, 休日, 福利厚生, 選考フロー, その他）",
  "summary": "string（質問の意図を15〜30文字程度で要約したもの。質問文をそのまま書き写さないこと）"
}

shouldLogは、質問が美容室の求人・採用に関係する内容で、かつFAQに追加する価値がある場合のみtrueにしてください。
以下のいずれかに該当する場合は必ずfalseにし、category・summaryは空文字にしてください。
- 求人・採用と明らかに無関係な内容
- アダルト・暴力・嫌がらせ・誹謗中傷など不適切な内容
- 意味の無い文字列やテスト目的と思われる内容`;
}

function extractJson(rawText: string): unknown {
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1] : rawText;
  return JSON.parse(jsonText.trim());
}

export async function classifyUnansweredQuestion(question: string): Promise<UnansweredQuestionClassification> {
  try {
    const model = getGeminiModel({ systemInstruction: SYSTEM_INSTRUCTION });
    const result = await model.generateContent(buildPrompt(question));
    const parsed = extractJson(result.response.text()) as Partial<UnansweredQuestionClassification>;
    if (typeof parsed !== "object" || parsed === null || typeof parsed.shouldLog !== "boolean") {
      return { shouldLog: false, category: "", summary: "" };
    }
    return {
      shouldLog: parsed.shouldLog,
      category: typeof parsed.category === "string" ? parsed.category.slice(0, 50) : "",
      summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 200) : "",
    };
  } catch (error) {
    // 分類に失敗した場合は安全側に倒し、保存しない（内容不明のまま残すより、
    // FAQ拡充のヒントを1件取りこぼす方を選ぶ）。
    console.error("[classifyUnansweredQuestion] failed:", error);
    return { shouldLog: false, category: "", summary: "" };
  }
}
