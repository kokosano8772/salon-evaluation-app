// 美容室AI対策診断（Salon AI Check）で共通して使う型定義。
// 既存の美容室価値診断（lib/types.ts）とは別物（データの出どころがQ&A回答ではなく
// クロール結果+ルール判定のため）。カテゴリ/ランクの考え方だけ踏襲している。

export type AiCheckCategoryId =
  | "store_info" // A. 店舗情報・AI理解度 15点
  | "specialty" // B. 専門性・独自性 15点
  | "menu" // C. メニュー・悩み解決情報 15点
  | "web_structure" // D. Webサイト・技術構造 15点
  | "content_faq" // E. コンテンツ・FAQ 15点
  | "staff" // F. スタッフ・実績・信頼性 10点
  | "google_reviews" // G. Google・口コミ・外部情報 10点（手動入力含む）
  | "ai_search"; // H. AI検索対応度 5点（AI判定）

export const AI_CHECK_CATEGORY_LABEL: Record<AiCheckCategoryId, string> = {
  store_info: "店舗情報・AI理解度",
  specialty: "専門性・独自性",
  menu: "メニュー・悩み解決情報",
  web_structure: "Webサイト・技術構造",
  content_faq: "コンテンツ・FAQ",
  staff: "スタッフ・実績・信頼性",
  google_reviews: "Google・口コミ・外部情報",
  ai_search: "AI検索対応度",
};

export const AI_CHECK_CATEGORY_MAX: Record<AiCheckCategoryId, number> = {
  store_info: 15,
  specialty: 15,
  menu: 15,
  web_structure: 15,
  content_faq: 15,
  staff: 10,
  google_reviews: 10,
  ai_search: 5,
};

// pass=満たしている / fail=満たしていない（手動入力で「なし」等、明確に無いと分かった場合のみ）
// unknown=クロールで確認できなかった（0点にはなるが「できていない」と断定した表示はしない）
export type DiagnosisItemStatus = "pass" | "fail" | "unknown";

export interface DiagnosisItem {
  id: string;
  categoryId: AiCheckCategoryId;
  label: string;
  maxScore: number;
  score: number;
  status: DiagnosisItemStatus;
}

export interface AiCheckCategoryScore {
  categoryId: AiCheckCategoryId;
  score: number;
  maxScore: number;
}

export type AiCheckRank = "S" | "A" | "B" | "C" | "D" | "E";

export interface AiCheckRankInfo {
  rank: AiCheckRank;
  label: string;
  description: string;
  color: string;
  minScore: number;
  maxScore: number;
}

export const AI_CHECK_RANK_INFO: Record<AiCheckRank, AiCheckRankInfo> = {
  S: { rank: "S", label: "Sランク", description: "AI対策が非常に充実しています", color: "#5B9BD5", minScore: 90, maxScore: 100 },
  A: { rank: "A", label: "Aランク", description: "AI対策がかなり充実しています", color: "#7C9EB5", minScore: 80, maxScore: 89 },
  B: { rank: "B", label: "Bランク", description: "基本対策はできています", color: "#9B8DBF", minScore: 70, maxScore: 79 },
  C: { rank: "C", label: "Cランク", description: "改善余地が大きいです", color: "#6BAB8A", minScore: 60, maxScore: 69 },
  D: { rank: "D", label: "Dランク", description: "AIに情報が伝わりにくい状態です", color: "#E08B6B", minScore: 40, maxScore: 59 },
  E: { rank: "E", label: "Eランク", description: "AI対策がほぼできていません", color: "#D9534F", minScore: 0, maxScore: 39 },
};

export function calculateAiCheckRank(totalScore: number): AiCheckRank {
  if (totalScore >= 90) return "S";
  if (totalScore >= 80) return "A";
  if (totalScore >= 70) return "B";
  if (totalScore >= 60) return "C";
  if (totalScore >= 40) return "D";
  return "E";
}

// G.カテゴリ(Google・口コミ)のうちPhase 1で手動入力してもらう最小項目。
// 残り2項目（口コミに施術内容が含まれるか／他媒体との店舗情報一致）はPhase 1では
// 確認手段が無いため、常にunknown扱いにする（0点にはなるが「無い」と断定しない）。
export interface GoogleReviewsManualInput {
  hasGoogleBusinessProfile: boolean;
  reviewCount: number;
  averageRating: number; // 0〜5
}

export interface AiCheckAnalysis {
  summary: string;
  target: string;
  strengths: string[];
  weaknesses: string[];
  missingInformation: string[];
  aiSearchAnswers: { question: string; canAnswer: boolean }[]; // H.カテゴリのQ1〜Q5
}

export interface AiCheckRecommendation {
  priority: "high" | "medium" | "low";
  category: string;
  problem: string;
  reason: string;
  solution: string;
}
