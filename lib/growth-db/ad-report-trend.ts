// レポート画面の複数月トレンド（年間CTR・年齢別クリック数推移）用の純粋な集計ロジック。
// AIには一切計算させず、ここで確定した数値だけをレポートに描画する。

import { AGE_GROUPS, AdReport } from "./ad-report-types";

const TREND_MONTHS = 12;

// history は yearMonth 昇順（listAdReports の返り値）を前提とする
function recentReports(history: AdReport[], platform: AdReport["platform"], uptoYearMonth: string): AdReport[] {
  return history
    .filter((r) => r.platform === platform && r.yearMonth <= uptoYearMonth)
    .slice(-TREND_MONTHS);
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
