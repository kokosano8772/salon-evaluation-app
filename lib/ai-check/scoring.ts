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
