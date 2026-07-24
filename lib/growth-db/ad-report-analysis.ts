// 広告レポートの数値分析（前月比較・キャンペーン比較・成長データとの関連）。
// AIには一切計算させず、ここで確定した数値だけをAIの解釈対象として渡す
// （lib/growth-db/scoring.ts の findDomainValue/calculateGrowthRate と同じ、
// 0除算ガード付きの前月比%計算スタイルを踏襲する）。

import { AdCampaignMetrics, AdReport } from "./ad-report-types";
import { MonthlyMetrics } from "./types";

export interface MetricComparison {
  current: number;
  previous: number | null;
  changePercent: number | null; // 比較対象が無い、または0の場合はnull
}

export function compareMetric(current: number, previous: number | undefined | null): MetricComparison {
  if (previous === undefined || previous === null || previous === 0) {
    return { current, previous: previous ?? null, changePercent: null };
  }
  const changePercent = Math.round(((current - previous) / previous) * 1000) / 10;
  return { current, previous, changePercent };
}

// ---- ① 前月比較 ----

export interface AdReportComparison {
  spend: MetricComparison;
  impressions: MetricComparison;
  clicks: MetricComparison;
  ctr: MetricComparison;
  cpc: MetricComparison;
  conversions: MetricComparison;
  cpa: MetricComparison;
  cvr: MetricComparison;
}

export function compareAdReports(current: AdReport, previous: AdReport | null): AdReportComparison {
  return {
    spend: compareMetric(current.spend, previous?.spend),
    impressions: compareMetric(current.impressions, previous?.impressions),
    clicks: compareMetric(current.clicks, previous?.clicks),
    ctr: compareMetric(current.ctr, previous?.ctr),
    cpc: compareMetric(current.cpc, previous?.cpc),
    conversions: compareMetric(current.conversions, previous?.conversions),
    cpa: compareMetric(current.cpa, previous?.cpa),
    cvr: compareMetric(current.cvr, previous?.cvr),
  };
}

// 履歴（yearMonth昇順）から、指定platformの直前の月のAdReportを探す
export function findPreviousAdReport(history: AdReport[], currentReport: AdReport): AdReport | null {
  const samePlatform = history
    .filter((r) => r.platform === currentReport.platform && r.yearMonth < currentReport.yearMonth)
    .sort((a, b) => (a.yearMonth < b.yearMonth ? 1 : -1));
  return samePlatform[0] ?? null;
}

// ---- ② キャンペーン分析 ----

export interface CampaignAnalysis {
  best: AdCampaignMetrics | null; // コンバージョンがある中でCPAが最も低い
  worst: AdCampaignMetrics | null; // コンバージョンが無い、またはCPAが最も高い
  highSpendLowPerformance: AdCampaignMetrics[]; // 広告費が平均以上なのにCVRが平均未満
  worsened: { campaign: AdCampaignMetrics; previousCpa: number; cpaChangePercent: number }[]; // 前月比CPA悪化（名前で対応）
}

export function analyzeCampaigns(campaigns: AdCampaignMetrics[], previousCampaigns: AdCampaignMetrics[] = []): CampaignAnalysis {
  const withConversions = campaigns.filter((c) => c.conversions > 0);

  const best =
    withConversions.length > 0
      ? withConversions.reduce((a, b) => (a.cpa <= b.cpa ? a : b))
      : null;

  const worst =
    campaigns.length > 0
      ? campaigns.reduce((a, b) => {
          // コンバージョン0は「最も悪い」扱い、それ以外はCPAが高い方
          if (a.conversions === 0 && b.conversions === 0) return a.spend >= b.spend ? a : b;
          if (a.conversions === 0) return a;
          if (b.conversions === 0) return b;
          return a.cpa >= b.cpa ? a : b;
        })
      : null;

  const avgSpend = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.spend, 0) / campaigns.length : 0;
  const avgCvr = campaigns.length > 0 ? campaigns.reduce((s, c) => s + c.cvr, 0) / campaigns.length : 0;
  const highSpendLowPerformance = campaigns.filter((c) => c.spend >= avgSpend && c.cvr < avgCvr);

  const worsened: CampaignAnalysis["worsened"] = [];
  for (const campaign of campaigns) {
    const prev = previousCampaigns.find((p) => p.name === campaign.name);
    if (!prev || prev.cpa === 0) continue;
    const cpaChangePercent = Math.round(((campaign.cpa - prev.cpa) / prev.cpa) * 1000) / 10;
    if (cpaChangePercent > 0) {
      worsened.push({ campaign, previousCpa: prev.cpa, cpaChangePercent });
    }
  }

  return { best, worst, highSpendLowPerformance, worsened };
}

// ---- ③ 成長データとの関連 ----

export interface GrowthLinkComparison {
  totalRevenue: MetricComparison | null;
  newCustomers: MetricComparison | null;
  existingCustomers: MetricComparison | null;
  totalVisits: MetricComparison | null;
  averageUnitPrice: MetricComparison | null;
}

// history は yearMonth 昇順（listMonthlyData の返り値）を前提とする
export function compareGrowthMetrics(history: MonthlyMetrics[], yearMonth: string): GrowthLinkComparison {
  const index = history.findIndex((m) => m.yearMonth === yearMonth);
  const current = index >= 0 ? history[index] : undefined;
  const previous = index > 0 ? history[index - 1] : undefined;

  const currentRevenue = current?.revenue;
  const previousRevenue = previous?.revenue;

  if (!currentRevenue) {
    return { totalRevenue: null, newCustomers: null, existingCustomers: null, totalVisits: null, averageUnitPrice: null };
  }

  return {
    totalRevenue: compareMetric(currentRevenue.totalRevenue, previousRevenue?.totalRevenue),
    newCustomers: compareMetric(currentRevenue.newCustomers, previousRevenue?.newCustomers),
    existingCustomers: compareMetric(currentRevenue.existingCustomers, previousRevenue?.existingCustomers),
    totalVisits: compareMetric(currentRevenue.totalVisits, previousRevenue?.totalVisits),
    averageUnitPrice: compareMetric(currentRevenue.averageUnitPrice, previousRevenue?.averageUnitPrice),
  };
}
