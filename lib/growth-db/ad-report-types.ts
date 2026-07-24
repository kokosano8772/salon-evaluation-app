// 広告レポート機能専用の型定義。lib/growth-db/types.ts（既存の月次データ）とは
// 独立させ、monthly_metricsのスキーマには一切手を加えない。

export type AdPlatform = "google" | "meta";

// Google Ads API・Meta Marketing APIどちらのレスポンスも、保存前にこの共通形式に
// 変換してから使う（外部APIとレポート生成ロジックを疎結合にするための境界）。
export interface AdCampaignMetrics {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number; // %
  cpc: number; // 円
  conversions: number;
  cpa: number; // 円
  cvr: number; // %
}

export interface AdReport {
  id: string;
  storeId: string;
  yearMonth: string; // "YYYY-MM"
  platform: AdPlatform;
  accountId: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  cvr: number;
  reach?: number; // Metaのみ
  frequency?: number; // Metaのみ
  campaigns: AdCampaignMetrics[];
  aiResult: string | null;
  createdAt: string;
  updatedAt: string;
}

export const AD_PLATFORM_LABEL: Record<AdPlatform, string> = {
  google: "Google広告",
  meta: "Meta広告（Instagram/Facebook）",
};
