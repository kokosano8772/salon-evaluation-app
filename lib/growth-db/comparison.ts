// 「同規模・地域平均との比較」機能の中核ロジック。
//
// 同規模判定は単一条件ではなく優先順位付きの重み付き類似度で行う
// （スタッフ人数 > 平均客単価 > 商圏 > 店舗形態 > 席数）。店舗数が増えた際は
// この重みやレンジを調整するだけで自動抽出の精度を上げていける設計にしてある。

import { GrowthCategoryScore, GrowthScore, Store } from "./types";

const WEIGHTS = {
  staffCount: 0.4,
  averageUnitPrice: 0.25,
  tradeArea: 0.15,
  storeFormat: 0.15,
  seatCount: 0.05,
};

// 差分を正規化するためのレンジ（実データが増えたら調整可能）
const STAFF_COUNT_RANGE = 20;
const UNIT_PRICE_RANGE = 15000;
const SEAT_COUNT_RANGE = 15;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function numericDistance(a: number, b: number, range: number): number {
  return clamp01(Math.abs(a - b) / range);
}

// 片方でも未設定（空文字）なら中立値。両方設定済みで不一致なら最大距離。
function categoricalDistance(a: string, b: string): number {
  if (!a || !b) return 0.5;
  return a === b ? 0 : 1;
}

export function calculateSimilarityDistance(a: Store, b: Store): number {
  const staffDist = numericDistance(a.staffCount, b.staffCount, STAFF_COUNT_RANGE);
  const priceDist = numericDistance(a.averageUnitPrice, b.averageUnitPrice, UNIT_PRICE_RANGE);
  const tradeDist = categoricalDistance(a.tradeArea, b.tradeArea);
  const formatDist = categoricalDistance(a.storeFormat, b.storeFormat);
  const seatDist = numericDistance(a.seatCount, b.seatCount, SEAT_COUNT_RANGE);

  return (
    staffDist * WEIGHTS.staffCount +
    priceDist * WEIGHTS.averageUnitPrice +
    tradeDist * WEIGHTS.tradeArea +
    formatDist * WEIGHTS.storeFormat +
    seatDist * WEIGHTS.seatCount
  );
}

const DEFAULT_PEER_GROUP_SIZE = 5;

// 距離が近い順に上位N件を「同規模店舗」として抽出する
export function findPeerGroup(target: Store, allStores: Store[], limit = DEFAULT_PEER_GROUP_SIZE): Store[] {
  return allStores
    .filter((s) => s.id !== target.id)
    .map((s) => ({ store: s, distance: calculateSimilarityDistance(target, s) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((x) => x.store);
}

// "東京都渋谷区" -> "東京都" のように都道府県部分だけを取り出す
const PREFECTURE_SUFFIX_REGEX = /^(.+?[都道府県])/;

export function extractPrefecture(area: string): string {
  const match = area.match(PREFECTURE_SUFFIX_REGEX);
  return match ? match[1] : area;
}

const MIN_REGIONAL_GROUP_SIZE = 3;

export interface RegionalGroupResult {
  stores: Store[];
  level: "municipality" | "prefecture";
  label: string;
}

// 市区町村(area完全一致)を優先し、件数が少なければ都道府県単位にフォールバックする
export function findRegionalGroup(target: Store, allStores: Store[]): RegionalGroupResult {
  const others = allStores.filter((s) => s.id !== target.id);
  const sameMunicipality = others.filter((s) => target.area !== "" && s.area === target.area);

  if (sameMunicipality.length >= MIN_REGIONAL_GROUP_SIZE) {
    return { stores: sameMunicipality, level: "municipality", label: target.area };
  }

  const targetPrefecture = extractPrefecture(target.area);
  const samePrefecture = others.filter(
    (s) => targetPrefecture !== "" && extractPrefecture(s.area) === targetPrefecture
  );
  return { stores: samePrefecture, level: "prefecture", label: targetPrefecture };
}

// 複数店舗のGrowthScoreからカテゴリ単位で平均した合成スコアを作る（比較表示専用、保存はしない）
export function averageGrowthScores(scores: GrowthScore[]): GrowthScore | null {
  if (scores.length === 0) return null;

  const categoryCount = scores[0].categoryScores.length;
  const categoryScores: GrowthCategoryScore[] = [];
  for (let i = 0; i < categoryCount; i++) {
    const matching = scores.map((s) => s.categoryScores[i]).filter(Boolean);
    if (matching.length === 0) continue;
    const avgScore = Math.round(matching.reduce((sum, c) => sum + c.score, 0) / matching.length);
    const template = matching[0];
    categoryScores.push({
      categoryId: template.categoryId,
      name: template.name,
      nameEn: template.nameEn,
      score: avgScore,
      maxScore: template.maxScore,
      percentage: Math.round((avgScore / template.maxScore) * 100),
      color: template.color,
    });
  }

  const totalScore = Math.round(scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length);

  return {
    storeId: "__average__",
    yearMonth: scores[0].yearMonth,
    totalScore,
    categoryScores,
    computedAt: new Date().toISOString(),
  };
}
