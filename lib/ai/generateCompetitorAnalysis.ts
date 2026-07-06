// 競合比較データからAI分析レポート（8セクション、ストリーミング）を生成する。
// 呼び出し側（APIルート）はこの関数だけを使う。lib/ai/gemini.ts の差し替え境界を
// generateGrowthSuggestions.ts と共用し、Gemini呼び出しを重複実装しない。

import { getGeminiModel } from "./gemini";
import { buildCompetitorAnalysisPrompt } from "@/lib/competitor-research/build-prompt";
import type { AnalysisMode, ComparisonData, SalonData } from "@/lib/competitor-research/types";

const SYSTEM_INSTRUCTION =
  "あなたは美容サロン業界（美容室・ネイル・アイラッシュ）の経営・採用専門コンサルタントです。" +
  "データを根拠にした具体的・実践的な提案を日本語で提供してください。" +
  "箇条書きは「・」で始め、1項目あたり1〜2文で完結させてください。";

export async function streamCompetitorAnalysis(
  salons: SalonData[],
  mode: AnalysisMode,
  cellData: ComparisonData
) {
  const model = getGeminiModel({ plainText: true, systemInstruction: SYSTEM_INSTRUCTION });
  const prompt = buildCompetitorAnalysisPrompt(salons, mode, cellData);
  return model.generateContentStream(prompt);
}
