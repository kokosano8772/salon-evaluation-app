import { AiJudgedItemDefinition } from "./build-ai-check-prompt";
import { QUIZ_QUESTIONS } from "./quiz-questions";
import { AI_CHECK_CATEGORY_MAX, AiCheckCategoryId, AiCheckCategoryScore, DiagnosisItem } from "./types";

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

// プロ版のクイズ回答（質問id→選択した選択肢のインデックス=そのまま得点）を
// DiagnosisItem[]に変換する。AIには一切スコアリングを任せない（設計書34章）。
// 回答が無い／範囲外の項目は「確認できなかった」扱い（unknown、0点）にし、
// falseと断定しない。
export function applyQuizAnswers(answers: Record<string, number>): DiagnosisItem[] {
  return QUIZ_QUESTIONS.map((q) => {
    const score = answers[q.id];
    if (typeof score !== "number" || score < 0 || score > q.maxScore) {
      return { id: q.id, categoryId: q.categoryId, label: q.question, maxScore: q.maxScore, score: 0, status: "unknown" as const };
    }
    const status = score === q.maxScore ? "pass" : score === 0 ? "fail" : "partial";
    return { id: q.id, categoryId: q.categoryId, label: q.question, maxScore: q.maxScore, score, status: status as DiagnosisItem["status"] };
  });
}

// AI_JUDGED_ITEMS（クロール内容から判定できる24項目）に対するAIのtrue/false判定を
// DiagnosisItem[]に変換する。配点はAI_JUDGED_ITEMSの固定表に従う決定的な変換のみを行い、
// スコアの算出自体はAIに委ねない（設計書34章）。AIが判定を返し忘れた・不正な値を返した
// 項目はunknown（0点、未確認として表示）にし、falseと断定しない。
export function buildAiJudgedDiagnosisItems(
  items: Record<string, boolean>,
  definitions: AiJudgedItemDefinition[]
): DiagnosisItem[] {
  return definitions.map((d) => {
    const judged = items[d.id];
    if (typeof judged !== "boolean") {
      return { id: d.id, categoryId: d.categoryId, label: d.label, maxScore: d.maxScore, score: 0, status: "unknown" as const };
    }
    return {
      id: d.id,
      categoryId: d.categoryId,
      label: d.label,
      maxScore: d.maxScore,
      score: judged ? d.maxScore : 0,
      status: judged ? ("pass" as const) : ("fail" as const),
    };
  });
}
