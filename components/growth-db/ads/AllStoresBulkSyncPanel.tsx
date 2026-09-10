"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import * as repo from "@/lib/growth-db/ad-report-repository";
import { getStores } from "@/lib/growth-db/repository";
import { AdSyncDefault, listAdSyncDefaults } from "@/lib/growth-db/ad-sync-defaults";
import { AdPlatform, AdReportCategory } from "@/lib/growth-db/ad-report-types";

interface AllStoresBulkSyncPanelProps {
  platform: AdPlatform;
  category: AdReportCategory;
  yearMonth: string;
  onSaved?: () => void;
}

interface StoreTarget {
  storeId: string;
  storeName: string;
  syncDefault: AdSyncDefault | null; // nullの場合は個別ページで一度も同期設定していない店舗
}

interface StoreResult {
  storeId: string;
  storeName: string;
  status: "not-configured" | "pending" | "syncing" | "success" | "skipped" | "error";
  message?: string;
  campaignCount?: number;
}

// 「複数月まとめて同期」（AdReportBulkSyncPanel.tsx、1店舗×複数月をループ）と同じ仕組みを、
// 「1ヶ月×複数店舗」でループする店舗横断版。月初に全店舗分をまとめて同期してから各店の
// レポート作成に入ることで、業種別ライブ平均（getBusinessCategoryAverageCvr）の元になる
// データが店舗ごとの同期タイミングでバラつかないようにする運用を想定している。
export default function AllStoresBulkSyncPanel({ platform, category, yearMonth, onSaved }: AllStoresBulkSyncPanelProps) {
  const [loadingStores, setLoadingStores] = useState(true);
  const [targets, setTargets] = useState<StoreTarget[]>([]);
  const [loadError, setLoadError] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StoreResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoadingStores(true);
    setLoadError("");
    setResults([]);

    (async () => {
      try {
        const { items } = await getStores({
          googleAdsOnly: platform === "google" ? true : undefined,
          metaAdsOnly: platform === "meta" ? true : undefined,
          pageSize: 1000,
        });
        const storeIds = items.map((s) => s.id);
        const defaults = await listAdSyncDefaults(storeIds, platform, category);
        if (cancelled) return;
        setTargets(
          items
            .map((s) => ({ storeId: s.id, storeName: s.name, syncDefault: defaults.get(s.id) ?? null }))
            .sort((a, b) => a.storeName.localeCompare(b.storeName, "ja"))
        );
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "不明なエラー");
      } finally {
        if (!cancelled) setLoadingStores(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [platform, category]);

  const configuredTargets = targets.filter((t) => t.syncDefault);
  const unconfiguredTargets = targets.filter((t) => !t.syncDefault);

  const handleRun = async () => {
    if (running || configuredTargets.length === 0) return;

    setRunning(true);
    setResults([
      ...configuredTargets.map((t) => ({ storeId: t.storeId, storeName: t.storeName, status: "pending" as const })),
      ...unconfiguredTargets.map((t) => ({ storeId: t.storeId, storeName: t.storeName, status: "not-configured" as const })),
    ]);

    for (const target of configuredTargets) {
      const syncDefault = target.syncDefault!;
      setResults((prev) => prev.map((r) => (r.storeId === target.storeId ? { ...r, status: "syncing" } : r)));
      try {
        const res = await fetch("/api/growth-db/ad-report-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            accountId: syncDefault.accountId,
            yearMonth,
            campaignNameFilter: syncDefault.campaignNameFilter || undefined,
            campaignNameExclude: syncDefault.campaignNameExclude || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

        if (json.skipped) {
          setResults((prev) =>
            prev.map((r) => (r.storeId === target.storeId ? { ...r, status: "skipped", message: json.message } : r))
          );
          continue;
        }

        await repo.upsertAdReport(target.storeId, yearMonth, platform, { ...json.data, accountId: syncDefault.accountId }, category);
        setResults((prev) =>
          prev.map((r) =>
            r.storeId === target.storeId
              ? { ...r, status: "success", campaignCount: json.data.campaigns?.length ?? 0 }
              : r
          )
        );
      } catch (err) {
        setResults((prev) =>
          prev.map((r) =>
            r.storeId === target.storeId
              ? { ...r, status: "error", message: err instanceof Error ? err.message : "不明なエラー" }
              : r
          )
        );
      }
    }

    setRunning(false);
    onSaved?.();
  };

  return (
    <div className="card-luxury p-6 mb-6">
      <p className="text-sm font-semibold text-charcoal-900 mb-1">全店舗まとめてAPI同期</p>
      <p className="text-xs text-gray-400 mb-4">
        選択した月の分を、同期設定済みの店舗すべてでまとめて取得・保存します。まだ一度も同期していない店舗は、先に各店舗のページでアカウントID等を設定してください。
      </p>

      {loadingStores && <p className="text-xs text-gray-400">店舗一覧を読み込み中...</p>}
      {loadError && <p className="text-xs text-red-500">店舗一覧の取得に失敗しました: {loadError}</p>}

      {!loadingStores && !loadError && (
        <>
          <p className="text-xs text-gray-500 mb-3">
            対象店舗: {configuredTargets.length}件（同期設定済み）
            {unconfiguredTargets.length > 0 && ` / 未設定 ${unconfiguredTargets.length}件`}
          </p>

          <button
            onClick={handleRun}
            disabled={running || configuredTargets.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            {running ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} strokeWidth={2} />}
            {running ? "同期中..." : "全店舗まとめて同期を実行"}
          </button>

          {results.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {results.map((r) => (
                <div key={r.storeId} className="flex items-center gap-2 text-xs">
                  <span className="w-32 shrink-0 text-gray-500 truncate">{r.storeName}</span>
                  {r.status === "pending" && <span className="text-gray-300">待機中</span>}
                  {r.status === "syncing" && <Loader2 size={12} className="animate-spin text-[#C4788A]" />}
                  {r.status === "success" && (
                    <span className="flex items-center gap-1 text-[#6BAB8A]">
                      <Check size={12} />
                      完了（キャンペーン{r.campaignCount}件）
                    </span>
                  )}
                  {r.status === "skipped" && <span className="text-gray-400">スキップ（キャンペーン開始前）</span>}
                  {r.status === "not-configured" && <span className="text-gray-300">未設定（対象外）</span>}
                  {r.status === "error" && (
                    <span className="flex items-center gap-1 text-red-500">
                      <X size={12} />
                      {r.message}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
