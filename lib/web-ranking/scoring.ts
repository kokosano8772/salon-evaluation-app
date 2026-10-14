import { RuleItemResult } from "./rule-evaluators/hp";
import { RankingCategoryScore, RankingCriteriaItem, RankingScoredItem } from "./types";

// criteria_items（DBの採点基準）＋ルール判定結果＋AI判定結果を、実際のスコア行に
// 変換する。配点はitem.maxScoreに従う決定的な変換のみを行い、スコアの算出自体を
// AIに委ねない（設計書4.6「AIは採点を無条件で全面委任しない」）。
export function buildScoredItems(
  criteriaItems: RankingCriteriaItem[],
  ruleResults: Record<string, RuleItemResult>,
  aiJudgedItems: Record<string, boolean>
): RankingScoredItem[] {
  return criteriaItems.map((item) => {
    const base = { criteriaItemId: item.id, itemKey: item.itemKey, category: item.category, label: item.label, maxScore: item.maxScore };

    if (item.evaluationMethod === "deferred") {
      // ブランド・デザイン・可読性カテゴリ等、Phase 1で未実装の項目。0点/uknownでは
      // なく明示的に対象外にする（設計書4.6「取得できなかった≠品質が低い」）。
      return { ...base, score: 0, status: "not_applicable" as const };
    }

    if (item.evaluationMethod === "rule") {
      const r = ruleResults[item.itemKey];
      if (!r) return { ...base, score: 0, status: "unknown" as const };
      return { ...base, score: r.score, status: r.status, evidence: r.evidence };
    }

    if (item.evaluationMethod === "ai") {
      const judged = aiJudgedItems[item.itemKey];
      if (typeof judged !== "boolean") return { ...base, score: 0, status: "unknown" as const };
      return { ...base, score: judged ? item.maxScore : 0, status: judged ? ("pass" as const) : ("fail" as const) };
    }

    // manual: Phase 1では未実装（人手入力の仕組みが無い）。対象外として扱う。
    return { ...base, score: 0, status: "not_applicable" as const };
  });
}

// 対象外(not_applicable)項目は配点から除外して正規化する（設計書4.5「単店舗・多店舗の
// 公平性」。多店舗限定項目が単店舗サイトの減点にならないようにする、デザイン
// カテゴリが丸ごとnot_applicableなら分母からも除く、という両方のケースを扱う）。
export function aggregateCategoryScores(scoredItems: RankingScoredItem[]): RankingCategoryScore[] {
  const categories = Array.from(new Set(scoredItems.map((i) => i.category)));
  return categories.map((category) => {
    const applicable = scoredItems.filter((i) => i.category === category && i.status !== "not_applicable");
    return {
      category,
      score: applicable.reduce((sum, i) => sum + i.score, 0),
      maxScore: applicable.reduce((sum, i) => sum + i.maxScore, 0),
    };
  });
}

export function calculateTotalScore(categoryScores: RankingCategoryScore[]): { score: number; maxScore: number } {
  return {
    score: categoryScores.reduce((sum, c) => sum + c.score, 0),
    maxScore: categoryScores.reduce((sum, c) => sum + c.maxScore, 0),
  };
}
