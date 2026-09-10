"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2, RefreshCw, Store as StoreIcon, X } from "lucide-react";
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

type StoreStatus = "not-configured" | "pending" | "syncing" | "success" | "skipped" | "error";

interface StoreRow {
  storeId: string;
  storeName: string;
  syncDefault: AdSyncDefault | null; // nullの場合は個別ページで一度も同期設定していない店舗
  status: StoreStatus;
  message?: string;
  campaignCount?: number;
}

const STATUS_BADGE: Record<StoreStatus, { label: string; className: string }> = {
  "not-configured": { label: "未設定", className: "bg-gray-100 text-gray-400" },
  pending: { label: "待機中", className: "bg-gray-100 text-gray-500" },
  syncing: { label: "同期中", className: "bg-[#C4788A14] text-[#A85E74]" },
  success: { label: "完了", className: "bg-[#6BAB8A1a] text-[#4F9270]" },
  skipped: { label: "スキップ", className: "bg-gray-100 text-gray-500" },
  error: { label: "エラー", className: "bg-red-50 text-red-500" },
};

// 「複数月まとめて同期」（AdReportBulkSyncPanel.tsx、1店舗×複数月をループ）と同じ仕組みを、
// 「1ヶ月×複数店舗」でループする店舗横断版。月初に全店舗分をまとめて同期してから各店の
// レポート作成に入ることで、業種別ライブ平均（getBusinessCategoryAverageCvr）の元になる
// データが店舗ごとの同期タイミングでバラつかないようにする運用を想定している。
export default function AllStoresBulkSyncPanel({ platform, category, yearMonth, onSaved }: AllStoresBulkSyncPanelProps) {
  const [loadingStores, setLoadingStores] = useState(true);
  const [rows, setRows] = useState<StoreRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingStores(true);
    setLoadError("");
    setRows([]);

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
        setRows(
          items
            .map((s) => {
              const syncDefault = defaults.get(s.id) ?? null;
              return {
                storeId: s.id,
                storeName: s.name,
                syncDefault,
                status: (syncDefault ? "pending" : "not-configured") as StoreStatus,
              };
            })
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

  const configuredCount = rows.filter((r) => r.syncDefault).length;
  const unconfiguredCount = rows.length - configuredCount;

  const handleRun = async () => {
    if (running || configuredCount === 0) return;
    setRunning(true);

    for (const row of rows) {
      if (!row.syncDefault) continue;
      const syncDefault = row.syncDefault;
      setRows((prev) => prev.map((r) => (r.storeId === row.storeId ? { ...r, status: "syncing" } : r)));
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
          setRows((prev) =>
            prev.map((r) => (r.storeId === row.storeId ? { ...r, status: "skipped", message: json.message } : r))
          );
          continue;
        }

        await repo.upsertAdReport(row.storeId, yearMonth, platform, { ...json.data, accountId: syncDefault.accountId }, category);
        setRows((prev) =>
          prev.map((r) =>
            r.storeId === row.storeId
              ? { ...r, status: "success", campaignCount: json.data.campaigns?.length ?? 0 }
              : r
          )
        );
      } catch (err) {
        setRows((prev) =>
          prev.map((r) =>
            r.storeId === row.storeId
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
      <div className="flex items-center gap-3 mb-1">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)", color: "white" }}
        >
          <RefreshCw size={16} strokeWidth={2} />
        </div>
        <p className="text-sm font-semibold text-charcoal-900">全店舗まとめてAPI同期</p>
      </div>
      <p className="text-xs text-gray-400 mb-4 ml-12">
        選択した月の分を、同期設定済みの店舗すべてでまとめて取得・保存します。まだ一度も同期していない店舗は、先に各店舗のページでアカウントID等を設定してください。
      </p>

      {loadingStores && (
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Loader2 size={13} className="animate-spin" />
          店舗一覧を読み込み中...
        </p>
      )}
      {loadError && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <AlertCircle size={13} />
          店舗一覧の取得に失敗しました: {loadError}
        </p>
      )}

      {!loadingStores && !loadError && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6BAB8A1a] text-[#4F9270] text-xs font-semibold">
              <StoreIcon size={13} strokeWidth={2} />
              同期設定済み {configuredCount}件
            </div>
            {unconfiguredCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 text-xs font-semibold">
                <AlertCircle size={13} strokeWidth={2} />
                未設定 {unconfiguredCount}件
              </div>
            )}
          </div>

          <button
            onClick={handleRun}
            disabled={running || configuredCount === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 mb-4"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            {running ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} strokeWidth={2} />}
            {running ? "同期中..." : "全店舗まとめて同期を実行"}
          </button>

          {rows.length > 0 && (
            <div className="rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {rows.map((r) => {
                const badge = STATUS_BADGE[r.status];
                return (
                  <div key={r.storeId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="text-sm text-charcoal-700 truncate">{r.storeName}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.message && r.status === "error" && (
                        <span className="text-xs text-red-400 max-w-xs truncate" title={r.message}>
                          {r.message}
                        </span>
                      )}
                      {r.status === "success" && (
                        <span className="text-xs text-gray-400">キャンペーン{r.campaignCount}件</span>
                      )}
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                        {r.status === "syncing" && <Loader2 size={11} className="animate-spin" />}
                        {r.status === "success" && <Check size={11} />}
                        {r.status === "error" && <X size={11} />}
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
