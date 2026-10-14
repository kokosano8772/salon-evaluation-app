// WEBランキング機能の型定義。lib/ai-check/types.tsと似た考え方だが、採点基準自体が
// DB（ranking_criteria_items）でバージョン管理される点が異なる。

export type RankingSiteType = "hp" | "acquisition_lp" | "recruitment_lp";

export type RankingEvaluationMethod = "rule" | "ai" | "manual" | "deferred";

export type RankingApplicability = "always" | "multi_store_only" | "conditional";

// lib/ai-check/types.tsのDiagnosisItemStatus（pass/fail/partial/unknown）に
// not_applicable（対象外）を追加した5値。設計書4.5「適用されない項目は0点扱いに
// せず対象外として扱う」に対応する。
export type RankingItemStatus = "pass" | "fail" | "partial" | "unknown" | "not_applicable";

export interface RankingCriteriaItem {
  id: string;
  criteriaVersionId: string;
  itemKey: string;
  category: string;
  label: string;
  maxScore: number;
  evaluationMethod: RankingEvaluationMethod;
  applicability: RankingApplicability;
  sortOrder: number;
}

export interface RankingCriteriaVersion {
  id: string;
  siteType: RankingSiteType;
  versionLabel: string;
  status: "draft" | "active" | "archived";
  description: string;
}

export interface RankingScoredItem {
  criteriaItemId: string;
  itemKey: string;
  category: string;
  label: string;
  maxScore: number;
  score: number;
  status: RankingItemStatus;
  evidence?: { sourceUrl?: string; excerpt?: string; note?: string; confidence?: "high" | "medium" | "low" };
}

export interface RankingCategoryScore {
  category: string;
  score: number;
  maxScore: number;
}

export interface SalonContext {
  prefecture: string;
  city: string;
  storeCount: number | null;
}
