// ココデザイン独自診断：100点満点（集客力・リピート力・ブランド力・採用力・組織力 × 各20点）
//
// lib/scoring.ts（診断機能）とは独立した、月次データから自動計算される派生スコア。
// 各カテゴリはサブ指標の加重平均で構成され、しきい値・重みはすべてこのファイル内の
// 定数として管理する（チューニングしやすさを優先）。
//
// 欠損データの扱い：対象月にドメインが無い場合は直近の過去月へフォールバックし、
// それでも見つからないサブ指標は除外して残りの重みを再正規化する（0点扱いにはしない）。

import { GROWTH_CATEGORY_META } from "./constants";
import {
  GrowthCategoryId,
  GrowthCategoryScore,
  GrowthScore,
  MonthlyMetrics,
  MonthlyMetricsDomainKey,
} from "./types";

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function normalize(value: number, min: number, max: number, invert = false): number {
  const t = clamp01((value - min) / (max - min));
  return invert ? 1 - t : t;
}

function average(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function sumBy<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((sum, item) => sum + fn(item), 0);
}

interface DomainLookup<K extends MonthlyMetricsDomainKey> {
  value: NonNullable<MonthlyMetrics[K]>;
  index: number;
}

// history は yearMonth 昇順（listMonthlyData の返り値）を前提とする
function findDomainValue<K extends MonthlyMetricsDomainKey>(
  history: MonthlyMetrics[],
  fromIndex: number,
  domain: K
): DomainLookup<K> | undefined {
  for (let i = fromIndex; i >= 0; i--) {
    const value = history[i]?.[domain];
    if (value !== undefined) {
      return { value: value as NonNullable<MonthlyMetrics[K]>, index: i };
    }
  }
  return undefined;
}

interface SubMetric {
  key: string;
  label: string;
  weight: number;
  compute: (history: MonthlyMetrics[], uptoIndex: number) => number | undefined;
}

interface CategoryConfig {
  id: GrowthCategoryId;
  subMetrics: SubMetric[];
}

// --- 集客力 -----------------------------------------------------------
const acquisitionSubMetrics: SubMetric[] = [
  {
    key: "inflowGrowth",
    label: "総流入数の伸び",
    weight: 0.3,
    compute: (history, upto) => {
      const current = findDomainValue(history, upto, "acquisition");
      if (!current) return undefined;
      const previous = findDomainValue(history, current.index - 1, "acquisition");
      if (!previous) return undefined;
      const currentInflow = sumBy(current.value, (c) => c.inflow);
      const previousInflow = sumBy(previous.value, (c) => c.inflow);
      if (previousInflow === 0) return undefined;
      const growthPct = ((currentInflow - previousInflow) / previousInflow) * 100;
      return normalize(growthPct, -10, 30);
    },
  },
  {
    key: "avgCvr",
    label: "平均CVR",
    weight: 0.25,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "acquisition");
      if (!found) return undefined;
      const totalInflow = sumBy(found.value, (c) => c.inflow);
      const totalVisits = sumBy(found.value, (c) => c.visits);
      if (totalInflow === 0) return undefined;
      return normalize((totalVisits / totalInflow) * 100, 10, 60);
    },
  },
  {
    key: "channelDiversity",
    label: "チャネル多様性",
    weight: 0.15,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "acquisition");
      if (!found) return undefined;
      const activeChannels = found.value.filter((c) => c.inflow > 0).length;
      return normalize(activeChannels, 1, 9);
    },
  },
  {
    key: "gbpVisibility",
    label: "Googleビジネス閲覧・クリック",
    weight: 0.2,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "googleBusiness");
      if (!found) return undefined;
      return average([
        normalize(found.value.views, 200, 3000),
        normalize(found.value.webClicks, 10, 200),
      ]);
    },
  },
  {
    key: "aiSeoReadiness",
    label: "AI検索・SEO対応",
    weight: 0.1,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "website");
      if (!found) return undefined;
      return average([
        found.value.aiSearchListed ? 1 : 0,
        normalize(found.value.seoArticleCount, 0, 20),
      ]);
    },
  },
];

// --- リピート力 ---------------------------------------------------------
const repeatSubMetrics: SubMetric[] = [
  {
    key: "existingRepeatRate",
    label: "既存リピート率",
    weight: 0.3,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "repeat");
      return found ? normalize(found.value.existingRepeatRate, 25, 65) : undefined;
    },
  },
  {
    key: "thirdVisitRate",
    label: "3回来店率",
    weight: 0.2,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "repeat");
      return found ? normalize(found.value.thirdVisitRate, 15, 45) : undefined;
    },
  },
  {
    key: "designationRate",
    label: "指名率",
    weight: 0.2,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "repeat");
      return found ? normalize(found.value.designationRate, 15, 60) : undefined;
    },
  },
  {
    key: "churnRate",
    label: "失客率",
    weight: 0.15,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "repeat");
      return found ? normalize(found.value.churnRate, 5, 30, true) : undefined;
    },
  },
  {
    key: "bookingLineRate",
    label: "次回予約率・LINE登録率",
    weight: 0.15,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "repeat");
      if (!found) return undefined;
      return normalize(
        (found.value.nextBookingRate + found.value.lineRegistrationRate) / 2,
        20,
        70
      );
    },
  },
];

// --- ブランド力 ---------------------------------------------------------
const brandSubMetrics: SubMetric[] = [
  {
    key: "googleRating",
    label: "Google評価",
    weight: 0.25,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "brand");
      return found ? normalize(found.value.googleRating, 3.0, 5.0) : undefined;
    },
  },
  {
    key: "reviewCount",
    label: "口コミ数",
    weight: 0.15,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "googleBusiness");
      return found ? normalize(found.value.reviewCount, 10, 200) : undefined;
    },
  },
  {
    key: "referralRate",
    label: "紹介率",
    weight: 0.2,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "brand");
      return found ? normalize(found.value.referralRate, 3, 20) : undefined;
    },
  },
  {
    key: "npsSatisfaction",
    label: "NPS・アンケート満足度",
    weight: 0.2,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "brand");
      if (!found) return undefined;
      return average([
        normalize(found.value.nps, -20, 80),
        normalize(found.value.satisfactionScore, 50, 100),
      ]);
    },
  },
  {
    key: "searchVolume",
    label: "ブランド検索・指名検索",
    weight: 0.2,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "brand");
      if (!found) return undefined;
      return average([
        normalize(found.value.brandSearchVolume, 20, 300),
        normalize(found.value.designationSearchVolume, 10, 200),
      ]);
    },
  },
];

// --- 採用力 ---------------------------------------------------------
const recruitmentSubMetrics: SubMetric[] = [
  {
    key: "applicationRate",
    label: "応募率",
    weight: 0.25,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "recruiting");
      const rate = found ? average(found.value.map((m) => m.applicationRate)) : undefined;
      return rate === undefined ? undefined : normalize(rate, 20, 80);
    },
  },
  {
    key: "visitRate",
    label: "見学率",
    weight: 0.15,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "recruiting");
      const rate = found ? average(found.value.map((m) => m.visitRate)) : undefined;
      return rate === undefined ? undefined : normalize(rate, 40, 90);
    },
  },
  {
    key: "hireRate",
    label: "採用率",
    weight: 0.25,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "recruiting");
      const rate = found ? average(found.value.map((m) => m.hireRate)) : undefined;
      return rate === undefined ? undefined : normalize(rate, 20, 70);
    },
  },
  {
    key: "costPerHire",
    label: "採用単価",
    weight: 0.2,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "recruiting");
      if (!found) return undefined;
      const withHires = found.value.filter((m) => m.hires > 0);
      const cost = average(withHires.map((m) => m.costPerHire));
      return cost === undefined ? undefined : normalize(cost, 80000, 400000, true);
    },
  },
  {
    key: "mediaDiversity",
    label: "応募媒体の多様性",
    weight: 0.15,
    compute: (history, upto) => {
      const found = findDomainValue(history, upto, "recruiting");
      return found ? normalize(found.value.length, 1, 6) : undefined;
    },
  },
];

// --- 組織力 ---------------------------------------------------------
function makeOrganizationSubMetrics(staffCount: number): SubMetric[] {
  return [
    {
      key: "oneYearRetentionRate",
      label: "1年定着率",
      weight: 0.3,
      compute: (history, upto) => {
        const found = findDomainValue(history, upto, "retention");
        return found ? normalize(found.value.oneYearRetentionRate, 50, 95) : undefined;
      },
    },
    {
      key: "threeYearRetentionRate",
      label: "3年定着率",
      weight: 0.2,
      compute: (history, upto) => {
        const found = findDomainValue(history, upto, "retention");
        return found ? normalize(found.value.threeYearRetentionRate, 25, 75) : undefined;
      },
    },
    {
      key: "turnoverRate",
      label: "離職率",
      weight: 0.15,
      compute: (history, upto) => {
        const found = findDomainValue(history, upto, "retention");
        return found ? normalize(found.value.turnoverRate, 8, 35, true) : undefined;
      },
    },
    {
      key: "leadershipDepth",
      label: "店長・幹部数（スタッフ数比）",
      weight: 0.15,
      compute: (history, upto) => {
        const found = findDomainValue(history, upto, "retention");
        if (!found || staffCount <= 0) return undefined;
        const ratio = (found.value.managerCount + found.value.executiveCount) / staffCount;
        return normalize(ratio, 0.05, 0.25);
      },
    },
    {
      key: "systemMaturity",
      label: "教育・評価・マニュアル整備度",
      weight: 0.2,
      compute: (history, upto) => {
        const found = findDomainValue(history, upto, "retention");
        if (!found) return undefined;
        const avgLevel = average([
          found.value.educationSystemLevel,
          found.value.evaluationSystemLevel,
          found.value.manualLevel,
        ]);
        return avgLevel === undefined ? undefined : normalize(avgLevel, 0, 3);
      },
    },
  ];
}

function buildCategoryConfigs(staffCount: number): CategoryConfig[] {
  return [
    { id: "acquisition", subMetrics: acquisitionSubMetrics },
    { id: "repeat", subMetrics: repeatSubMetrics },
    { id: "brand", subMetrics: brandSubMetrics },
    { id: "recruitment", subMetrics: recruitmentSubMetrics },
    { id: "organization", subMetrics: makeOrganizationSubMetrics(staffCount) },
  ];
}

function calculateCategoryScore(
  config: CategoryConfig,
  history: MonthlyMetrics[],
  uptoIndex: number
): GrowthCategoryScore {
  const meta = GROWTH_CATEGORY_META[config.id];
  const results = config.subMetrics
    .map((sub) => ({ weight: sub.weight, value: sub.compute(history, uptoIndex) }))
    .filter((r): r is { weight: number; value: number } => r.value !== undefined);

  const totalWeight = sumBy(results, (r) => r.weight);
  const weightedSum = sumBy(results, (r) => r.value * r.weight);
  const ratio = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const score = Math.round(20 * ratio);

  return {
    categoryId: config.id,
    name: meta.name,
    nameEn: meta.nameEn,
    score,
    maxScore: 20,
    percentage: Math.round((score / 20) * 100),
    color: meta.color,
  };
}

// history: 対象店舗の全月次データ（yearMonth昇順）。yearMonth: スコアを出したい対象月。
// staffCount: 組織力カテゴリの店長・幹部比率算出に使う（Storeの現在値でよい）。
export function calculateGrowthScore(
  storeId: string,
  yearMonth: string,
  history: MonthlyMetrics[],
  staffCount: number
): GrowthScore {
  const sorted = [...history].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
  const targetIndex = sorted.findIndex((m) => m.yearMonth === yearMonth);
  const uptoIndex = targetIndex === -1 ? sorted.length - 1 : targetIndex;

  const categoryScores = buildCategoryConfigs(staffCount).map((config) =>
    calculateCategoryScore(config, sorted, uptoIndex)
  );
  const totalScore = sumBy(categoryScores, (c) => c.score);

  return {
    storeId,
    yearMonth,
    totalScore,
    categoryScores,
    computedAt: new Date().toISOString(),
  };
}

// 成長率：Nヶ月前のスコアとの比較（保存はせず都度計算）
export function calculateGrowthRate(current: GrowthScore, previous: GrowthScore | null): number | null {
  if (!previous || previous.totalScore === 0) return null;
  return Math.round(((current.totalScore - previous.totalScore) / previous.totalScore) * 1000) / 10;
}
