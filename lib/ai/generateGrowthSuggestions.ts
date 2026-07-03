// 成長データベースの月次データからAI改善提案を生成する。
// 呼び出し側（APIルート・UI）はこの関数だけを使う。内部実装（現在はGemini）を
// 将来Claude等へ差し替える場合も、このファイルの中身を変更するだけで済む設計。

import { getGeminiModel } from "./gemini";
import { AiGrowthSuggestion } from "./types";
import { GROWTH_CATEGORY_META } from "@/lib/growth-db/constants";
import { GrowthScore, MonthlyMetrics, Store } from "@/lib/growth-db/types";

function isValidSuggestion(x: unknown): x is AiGrowthSuggestion {
  return (
    typeof x === "object" &&
    x !== null &&
    typeof (x as Record<string, unknown>).categoryId === "string" &&
    typeof (x as Record<string, unknown>).title === "string" &&
    typeof (x as Record<string, unknown>).description === "string"
  );
}

function buildPrompt(store: Store, monthly: MonthlyMetrics, score: GrowthScore): string {
  const categoryIds = Object.keys(GROWTH_CATEGORY_META).join(", ");

  return `
あなたは美容室経営コンサルタントです。以下の店舗の月次データと独自診断スコアをもとに、
5つのカテゴリ（${categoryIds}）それぞれについて改善提案を1つずつ作成してください。

【店舗情報】
店舗名: ${store.name}
エリア: ${store.area}
スタッフ数: ${store.staffCount}名
商圏: ${store.tradeArea || "未設定"}
店舗形態: ${store.storeFormat || "未設定"}

【独自診断スコア（100点満点、カテゴリ20点ずつ）】
総合: ${score.totalScore}点
${score.categoryScores.map((c) => `${c.name}(${c.categoryId}): ${c.score}/20点`).join("\n")}

【${monthly.yearMonth}の実績データ】
${JSON.stringify(monthly, null, 2)}

以下のJSON配列の形式のみで出力してください。説明文やmarkdownのコードブロックは付けないでください。

[
  { "categoryId": "acquisition", "title": "...", "description": "..." },
  { "categoryId": "repeat", "title": "...", "description": "..." },
  { "categoryId": "brand", "title": "...", "description": "..." },
  { "categoryId": "recruitment", "title": "...", "description": "..." },
  { "categoryId": "organization", "title": "...", "description": "..." }
]

各descriptionは、実績データの具体的な数値を根拠として1つ以上引用し、2〜3文で実行可能な改善アクションを提案してください。
`.trim();
}

export async function generateGrowthSuggestions(
  store: Store,
  monthly: MonthlyMetrics,
  score: GrowthScore
): Promise<AiGrowthSuggestion[]> {
  const model = getGeminiModel();
  const prompt = buildPrompt(store, monthly, score);

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("AIの応答を解析できませんでした");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AIの応答の形式が不正です");
  }

  const suggestions = parsed.filter(isValidSuggestion);
  if (suggestions.length === 0) {
    throw new Error("AIの応答から提案を抽出できませんでした");
  }

  return suggestions;
}
