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

// 性別ごとの内訳。レポートの円グラフ・棒グラフに使う（男性/女性/その他）。
export interface GenderBreakdownValue {
  male: number;
  female: number;
  other: number;
}

export interface GenderBreakdown {
  impressions: GenderBreakdownValue;
  reach: GenderBreakdownValue;
  clicks: GenderBreakdownValue;
  ctr: GenderBreakdownValue; // %
}

export const AGE_GROUPS = ["20-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];

export interface AgeGroupClicks {
  ageGroup: AgeGroup;
  clicks: number;
}

// 24時間分の時間帯別クリック数（"0-1"〜"23-24"）
export const HOURLY_SLOTS = Array.from({ length: 24 }, (_, h) => `${h}-${h + 1}`);

export interface HourlyClicks {
  hour: string; // "0-1" 〜 "23-24"
  clicks: number;
  stopped?: boolean; // 配信停止していた時間帯
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
  genderBreakdown?: GenderBreakdown;
  hourlyClicks?: HourlyClicks[];
  ageGroupClicks?: AgeGroupClicks[];
  targetAgeRange: string; // 例: "20-39歳"
  aiResult: string | null;
  createdAt: string;
  updatedAt: string;
}

export const AD_PLATFORM_LABEL: Record<AdPlatform, string> = {
  google: "Google広告",
  meta: "Meta広告（Instagram/Facebook）",
};
