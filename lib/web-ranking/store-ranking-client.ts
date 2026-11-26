// 店舗起点のWEBランキング機能（/dashboard/stores/[storeId]/web-ranking）専用の
// 薄いfetchラッパー群。既存のWEBランキングAPI（salons/web-assets/audit-runs）は
// 無変更のまま呼び出し、新設のstore-ranking/*だけがこの機能専用。

export interface DiscoverCandidate {
  name: string;
  area: string;
  address: string;
  website: string;
  rating: number;
  reviewCount: number;
  alreadyRegistered: boolean;
  webAssetId: string | null;
}

export interface CompareResultRow {
  webAssetId: string;
  salonId: string;
  salonName: string;
  url: string;
  isOwn: boolean;
  rank: number | null;
  totalScore: number | null;
  totalMaxScore: number | null;
  diagnosedAt: string | null;
  latestAttemptStatus: string | null;
  crawlError: string | null;
  needsAudit: boolean;
}

export async function ensureOwnAsset(storeId: string): Promise<{ webAssetId: string; url: string }> {
  const res = await fetch("/api/web-ranking/store-ranking/own-asset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storeId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "自社サイトの登録に失敗しました");
  return data;
}

// 既存の discover 結果を登録する2段階呼び出し（app/dashboard/web-ranking/page.tsx の
// handleRegisterSelected と同じ流れ）。
export async function registerCompetitorAsset(candidate: DiscoverCandidate): Promise<string> {
  const salonRes = await fetch("/api/web-ranking/salons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: candidate.name, address: candidate.address }),
  });
  const salonData = await salonRes.json();
  if (!salonRes.ok) throw new Error(salonData.error ?? "競合サロンの登録に失敗しました");

  const assetRes = await fetch("/api/web-ranking/web-assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ salonId: salonData.id, url: candidate.website, siteType: "hp" }),
  });
  const assetData = await assetRes.json();
  if (!assetRes.ok) throw new Error(assetData.error ?? "競合サイトの登録に失敗しました");
  return assetData.id as string;
}

export async function runAudit(webAssetId: string): Promise<void> {
  const res = await fetch(`/api/web-ranking/web-assets/${webAssetId}/audit-runs`, { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `診断に失敗しました（HTTP ${res.status}）`);
  }
}

export async function fetchComparison(
  ownWebAssetId: string,
  competitorWebAssetIds: string[]
): Promise<CompareResultRow[]> {
  const res = await fetch("/api/web-ranking/store-ranking/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownWebAssetId, competitorWebAssetIds }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "比較の取得に失敗しました");
  return data.results as CompareResultRow[];
}
