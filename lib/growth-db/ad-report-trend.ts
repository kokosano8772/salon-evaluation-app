// レポート画面の複数月トレンド（年間CTR・年齢別クリック数推移・コンバージョン率/
// クリック数推移）用の純粋な集計ロジック。AIには一切計算させず、ここで確定した
// 数値だけをレポートに描画する。

import { AdReportCategory, AGE_GROUPS, AdReport } from "./ad-report-types";
import { shiftYearMonth } from "./format";

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

// Google広告レポートの「予約/問い合わせボタンを押した割合の推移」「クリック数の推移」用。
// 「直近12ヶ月」という単純なスライドウィンドウではなく、実際の運用に合わせて
// 「広告を始めた月を基準にした1年サイクル」で前年同期比較（2系列）を組む。
// 例: 7月に開始した店舗なら 7月始まり〜翌6月終わりが1サイクル。
// 進行中の今サイクル（1〜12ヶ月分）と、直前に完了した1年サイクル（最大12ヶ月分）を
// スロット位置（0=サイクル開始月）で揃えて返す。
export interface YoyCyclePoint {
  yearMonth: string;
  rate: number | null; // cvr (%)
  clicks: number | null;
}

export interface YoyTrend {
  previousCycleLabel: string; // 例: "2025.7〜"
  currentCycleLabel: string; // 例: "2026.7〜"
  previousCycle: YoyCyclePoint[]; // 常に12件（データが無い月はnull）
  currentCycle: YoyCyclePoint[]; // 常に12件（未到来・データが無い月はnull）
}

const EMPTY_YOY_TREND: YoyTrend = { previousCycleLabel: "", currentCycleLabel: "", previousCycle: [], currentCycle: [] };

export function buildYoyTrend(
  history: AdReport[],
  platform: AdReport["platform"],
  category: AdReportCategory,
  uptoYearMonth: string
): YoyTrend {
  const reports = history
    .filter((r) => r.platform === platform && r.category === category && r.yearMonth <= uptoYearMonth)
    .sort((a, b) => (a.yearMonth < b.yearMonth ? -1 : 1));
  if (reports.length === 0) return EMPTY_YOY_TREND;

  // アンカー月 = 記録が残っている最初の月の「月」。この月を基準に1年サイクルを区切る。
  const anchorMonth = Number(reports[0].yearMonth.split("-")[1]);

  let cycleStart = uptoYearMonth;
  for (let i = 0; i < 12; i++) {
    if (Number(cycleStart.split("-")[1]) === anchorMonth) break;
    cycleStart = shiftYearMonth(cycleStart, -1);
  }
  const previousCycleStart = shiftYearMonth(cycleStart, -12);

  const reportsByMonth = new Map(reports.map((r) => [r.yearMonth, r]));

  const previousCycle: YoyCyclePoint[] = Array.from({ length: 12 }, (_, i) => {
    const yearMonth = shiftYearMonth(previousCycleStart, i);
    const r = reportsByMonth.get(yearMonth);
    return { yearMonth, rate: r?.cvr ?? null, clicks: r?.clicks ?? null };
  });

  const currentCycle: YoyCyclePoint[] = Array.from({ length: 12 }, (_, i) => {
    const yearMonth = shiftYearMonth(cycleStart, i);
    if (yearMonth > uptoYearMonth) return { yearMonth, rate: null, clicks: null };
    const r = reportsByMonth.get(yearMonth);
    return { yearMonth, rate: r?.cvr ?? null, clicks: r?.clicks ?? null };
  });

  const [py, pm] = previousCycleStart.split("-");
  const [cy, cm] = cycleStart.split("-");

  return {
    previousCycleLabel: `${py}.${Number(pm)}〜`,
    currentCycleLabel: `${cy}.${Number(cm)}〜`,
    previousCycle,
    currentCycle,
  };
}
