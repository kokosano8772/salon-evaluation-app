// レポート画面の複数月トレンド（年間CTR・年齢別クリック数推移・コンバージョン率/
// クリック数推移）用の純粋な集計ロジック。AIには一切計算させず、ここで確定した
// 数値だけをレポートに描画する。

import { AdReportCategory, AGE_GROUPS, AdReport } from "./ad-report-types";

const TREND_MONTHS = 12;

// history は yearMonth 昇順（listAdReports の返り値）を前提とする。
// categoryはGoogle広告（集客/求人）でのみ意味を持つ。Metaは常にacquisition固定のため
// 省略時のデフォルトのままでよい。
function recentReports(
  history: AdReport[],
  platform: AdReport["platform"],
  uptoYearMonth: string,
  months: number = TREND_MONTHS,
  category: AdReportCategory = "acquisition"
): AdReport[] {
  return history
    .filter((r) => r.platform === platform && r.category === category && r.yearMonth <= uptoYearMonth)
    .slice(-months);
}

export interface CtrTrendPoint {
  yearMonth: string;
  ctr: number;
}

export function buildCtrTrend(history: AdReport[], platform: AdReport["platform"], uptoYearMonth: string): CtrTrendPoint[] {
  return recentReports(history, platform, uptoYearMonth).map((r) => ({ yearMonth: r.yearMonth, ctr: r.ctr }));
}

export type AgeGroupTrendPoint = { yearMonth: string; total: number } & Record<(typeof AGE_GROUPS)[number], number>;

export function buildAgeGroupTrend(
  history: AdReport[],
  platform: AdReport["platform"],
  uptoYearMonth: string
): AgeGroupTrendPoint[] {
  return recentReports(history, platform, uptoYearMonth)
    .filter((r) => r.ageGroupClicks && r.ageGroupClicks.length > 0)
    .map((r) => {
      const point = { yearMonth: r.yearMonth, total: 0 } as AgeGroupTrendPoint;
      for (const group of AGE_GROUPS) point[group] = 0;
      for (const entry of r.ageGroupClicks ?? []) {
        point[entry.ageGroup] = entry.clicks;
        point.total += entry.clicks;
      }
      return point;
    });
}

// Google広告レポートの「予約/問い合わせボタンを押した割合の推移」用。
// 集客は前年同期比較（2系列）で表示する想定のため、monthsに24等を指定して
// 呼び出し側（レポート画面）で直近12ヶ月・その前12ヶ月に分割して使う。
export interface ConversionRateTrendPoint {
  yearMonth: string;
  rate: number; // cvr (%)
}

export function buildConversionRateTrend(
  history: AdReport[],
  platform: AdReport["platform"],
  category: AdReportCategory,
  uptoYearMonth: string,
  months: number = TREND_MONTHS
): ConversionRateTrendPoint[] {
  return recentReports(history, platform, uptoYearMonth, months, category).map((r) => ({ yearMonth: r.yearMonth, rate: r.cvr }));
}

// Google広告（求人）レポートの「クリック数の推移」用。
export interface ClicksTrendPoint {
  yearMonth: string;
  clicks: number;
}

export function buildClicksTrend(
  history: AdReport[],
  platform: AdReport["platform"],
  category: AdReportCategory,
  uptoYearMonth: string,
  months: number = TREND_MONTHS
): ClicksTrendPoint[] {
  return recentReports(history, platform, uptoYearMonth, months, category).map((r) => ({ yearMonth: r.yearMonth, clicks: r.clicks }));
}
