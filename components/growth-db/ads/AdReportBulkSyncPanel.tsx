"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";
import * as repo from "@/lib/growth-db/ad-report-repository";
import { getAdSyncDefault, saveAdSyncDefault } from "@/lib/growth-db/ad-sync-defaults";
import { AdPlatform, AdReportCategory } from "@/lib/growth-db/ad-report-types";
import { currentYearMonth, formatMonthLabel, shiftYearMonth } from "@/lib/growth-db/format";

interface AdReportBulkSyncPanelProps {
  storeId: string;
  storeName: string;
  platform: AdPlatform;
  category?: AdReportCategory;
  onSaved?: () => void;
}

interface MonthResult {
  yearMonth: string;
  status: "pending" | "syncing" | "success" | "error";
  message?: string;
  campaignCount?: number;
}

function monthsInRange(start: string, end: string): string[] {
  const months: string[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor <= end && guard < 60) {
    months.push(cursor);
    cursor = shiftYearMonth(cursor, 1);
    guard++;
  }
  return months;
}

// 過去に運用していた分をまとめて取り込むための一括同期。既存の1ヶ月ずつの
// 「APIから同期」（AdReportForm内）はレビューしてから保存する流れだが、
// こちらは月数が多いことを想定し、取得したデータをその場で自動保存する。
export default function AdReportBulkSyncPanel({
  storeId,
  storeName,
  platform,
  category = "acquisition",
  onSaved,
}: AdReportBulkSyncPanelProps) {
  const [startMonth, setStartMonth] = useState(shiftYearMonth(currentYearMonth(), -5));
  const [endMonth, setEndMonth] = useState(currentYearMonth());
  const [accountId, setAccountId] = useState("");
  const [campaignNameFilter, setCampaignNameFilter] = useState(storeName);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<MonthResult[]>([]);

  // アカウントID・絞り込みキーワードは店舗×プラットフォーム×区分ごとに
  // stores.ad_sync_defaultsへ保存済みのものを自動で読み込む。
  useEffect(() => {
    let cancelled = false;
    getAdSyncDefault(storeId, platform, category).then((syncDefault) => {
      if (cancelled) return;
      setAccountId(syncDefault?.accountId ?? "");
      setCampaignNameFilter(syncDefault?.campaignNameFilter || storeName);
    });
    return () => {
      cancelled = true;
    };
  }, [storeId, platform, category, storeName]);

  const handleRun = async () => {
    if (!accountId.trim() || startMonth > endMonth || running) return;

    const months = monthsInRange(startMonth, endMonth);
    setRunning(true);
    setResults(months.map((yearMonth) => ({ yearMonth, status: "pending" })));

    const effectiveFilter = campaignNameFilter.trim();
    let succeededOnce = false;

    for (const yearMonth of months) {
      setResults((prev) => prev.map((r) => (r.yearMonth === yearMonth ? { ...r, status: "syncing" } : r)));
      try {
        const res = await fetch("/api/growth-db/ad-report-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            accountId,
            yearMonth,
            campaignNameFilter: effectiveFilter || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

        await repo.upsertAdReport(storeId, yearMonth, platform, { ...json.data, accountId }, category);
        succeededOnce = true;
        setResults((prev) =>
          prev.map((r) =>
            r.yearMonth === yearMonth
              ? { ...r, status: "success", campaignCount: json.data.campaigns?.length ?? 0 }
              : r
          )
        );
      } catch (err) {
        setResults((prev) =>
          prev.map((r) =>
            r.yearMonth === yearMonth
              ? { ...r, status: "error", message: err instanceof Error ? err.message : "不明なエラー" }
              : r
          )
        );
      }
    }

    // 1ヶ月でも同期に成功したら、その時使ったアカウントID・キーワードを
    // 店舗ごとに保存し、次回以降どの月でも自動で読み込まれるようにする。
    if (succeededOnce) {
      await saveAdSyncDefault(storeId, platform, category, { accountId, campaignNameFilter: effectiveFilter });
    }

    setRunning(false);
    onSaved?.();
  };

  return (
    <div className="card-luxury p-6 mb-6">
      <p className="text-sm font-semibold text-charcoal-900 mb-1">複数月まとめてAPI同期</p>
      <p className="text-xs text-gray-400 mb-4">
        導入前から運用していた分を、開始月〜終了月でまとめて取り込みます。取得したデータはその場で自動保存されます（コンバージョン数は含まれないため、後で個別に確認・入力してください）。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1.5">開始月</span>
          <input
            type="month"
            value={startMonth}
            onChange={(e) => e.target.value && setStartMonth(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A]"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1.5">終了月</span>
          <input
            type="month"
            value={endMonth}
            onChange={(e) => e.target.value && setEndMonth(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A]"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1.5">アカウントID</span>
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="act_xxxxxxxxxx"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A]"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1.5">キャンペーン名の絞り込みキーワード</span>
          <input
            type="text"
            value={campaignNameFilter}
            onChange={(e) => setCampaignNameFilter(e.target.value)}
            placeholder="例: 店舗名、店舗名(求人) など"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A]"
          />
        </label>
      </div>

      <button
        onClick={handleRun}
        disabled={running || !accountId.trim() || startMonth > endMonth}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
      >
        {running ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} strokeWidth={2} />}
        {running ? "同期中..." : "一括同期を実行"}
      </button>

      {results.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {results.map((r) => (
            <div key={r.yearMonth} className="flex items-center gap-2 text-xs">
              <span className="w-16 text-gray-500">{formatMonthLabel(r.yearMonth)}</span>
              {r.status === "pending" && <span className="text-gray-300">待機中</span>}
              {r.status === "syncing" && <Loader2 size={12} className="animate-spin text-[#C4788A]" />}
              {r.status === "success" && (
                <span className="flex items-center gap-1 text-[#6BAB8A]">
                  <Check size={12} />
                  完了（キャンペーン{r.campaignCount}件）
                </span>
              )}
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
    </div>
  );
}
