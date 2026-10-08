import { AI_JUDGED_ITEMS, AiCheckAiResponse } from "./build-ai-check-prompt";
import { AI_CHECK_CATEGORY_MAX, AiCheckCategoryId, AiCheckCategoryScore, DiagnosisItem } from "./types";

// AIが判定したitems（true/false）を、配点込みのDiagnosisItem[]に変換する。
// AIが万一キーを返し忘れた場合は「確認できなかった」扱い（unknown、0点）にし、
// falseと断定しない。
export function buildAiJudgedDiagnosisItems(aiResponse: AiCheckAiResponse): DiagnosisItem[] {
  return AI_JUDGED_ITEMS.map((def) => {
    const judged = aiResponse.items[def.id];
    if (typeof judged !== "boolean") {
      return { id: def.id, categoryId: def.categoryId, label: def.label, maxScore: def.maxScore, score: 0, status: "unknown" as const };
    }
    return {
      id: def.id,
      categoryId: def.categoryId,
      label: def.label,
      maxScore: def.maxScore,
      score: judged ? def.maxScore : 0,
      status: judged ? ("pass" as const) : ("fail" as const),
    };
  });
}

export function aggregateCategoryScores(items: DiagnosisItem[]): AiCheckCategoryScore[] {
  const categories = Object.keys(AI_CHECK_CATEGORY_MAX) as AiCheckCategoryId[];
  return categories.map((categoryId) => ({
    categoryId,
    score: items.filter((i) => i.categoryId === categoryId).reduce((sum, i) => sum + i.score, 0),
    maxScore: AI_CHECK_CATEGORY_MAX[categoryId],
  }));
}

export function calculateTotalScore(categoryScores: AiCheckCategoryScore[]): number {
  return categoryScores.reduce((sum, c) => sum + c.score, 0);
}

// Phase 2: 自動診断でfail/unknownだった項目について、本人が直接Yes/Noを回答した
// 内容をマージする（設計書24章の統合ルール＝自動判定が既にpassの項目は手動回答で
// 絶対に書き換えない。AIの再判定は挟まず、決定的にスコアを更新する）。
export function mergeManualAnswers(items: DiagnosisItem[], answers: Record<string, boolean>): DiagnosisItem[] {
  return items.map((i) => {
    if (i.status === "pass") return i;
    const answer = answers[i.id];
    if (typeof answer !== "boolean") return i;
    return { ...i, score: answer ? i.maxScore : 0, status: answer ? ("pass" as const) : ("fail" as const) };
  });
}
