"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AdReportForm from "@/components/growth-db/forms/AdReportForm";
import AdReportAnalysisSummary from "@/components/growth-db/ads/AdReportAnalysisSummary";
import AdReportBulkSyncPanel from "@/components/growth-db/ads/AdReportBulkSyncPanel";
import { useStore, useMonthlyMetrics } from "@/lib/growth-db/hooks";
import { useAdReports } from "@/lib/growth-db/ad-report-hooks";
import { currentYearMonth, shiftYearMonth } from "@/lib/growth-db/format";
import { AD_PLATFORM_LABEL, AD_REPORT_CATEGORY_LABEL, AdPlatform, AdReportCategory } from "@/lib/growth-db/ad-report-types";

const PLATFORMS: AdPlatform[] = ["google", "meta"];
const CATEGORIES: AdReportCategory[] = ["acquisition", "recruitment"];

export default function StoreAdsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const { store, loading: storeLoading } = useStore(storeId);
  // 成長データベースの月次データ（monthlyHistory）はAdReportAnalysisSummaryの
  // 「成長データとの関連」表示にのみ使う。広告データの月選択はこれに依存させない
  // （月次データが1件も無い新規店舗でも、任意の月の広告データを入力できるようにするため）。
  const { data: history, loading: historyLoading } = useMonthlyMetrics(storeId);
  const { items: adReports, loading: adReportsLoading, refresh: refreshAdReports } = useAdReports(storeId);

  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);
  const [platform, setPlatform] = useState<AdPlatform>("google");
  // 集客/求人の区分はGoogle広告のみで使う（Metaは常に集客扱い）
  const [category, setCategory] = useState<AdReportCategory>("acquisition");

  useEffect(() => {
    if (!selectedMonth && !adReportsLoading) {
      const platformMonths = adReports.filter((r) => r.platform === platform).map((r) => r.yearMonth).sort();
      // 広告レポートは前月分を見るのが基本のため、データが無い場合は当月ではなく前月をデフォルトにする
      setSelectedMonth(platformMonths.length > 0 ? platformMonths[platformMonths.length - 1] : shiftYearMonth(currentYearMonth(), -1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adReportsLoading, adReports.length]);

  if (storeLoading || historyLoading || adReportsLoading || !store || !selectedMonth) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  return (
    <div>
      <DashboardHeader
        title={`${store.name} - 広告レポート`}
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "成長データベース", href: "/dashboard/stores" },
          { label: store.name, href: `/dashboard/stores/${store.id}` },
          { label: "広告レポート" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && setSelectedMonth(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#C4788A]"
            />
            <Link
              href={`/dashboard/stores/${store.id}/ads/report?month=${selectedMonth}&platform=${platform}&category=${
                platform === "google" ? category : "acquisition"
              }`}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
            >
              <FileText size={15} strokeWidth={2} />
              レポートを見る
            </Link>
            <Link
              href={`/dashboard/stores/${store.id}`}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-charcoal-700 hover:bg-gray-50"
            >
              詳細に戻る
            </Link>
          </div>
        }
      />

      <div className="flex items-center gap-1 mb-6 border-b border-gray-100">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              platform === p ? "border-[#C4788A] text-[#C4788A]" : "border-transparent text-gray-400 hover:text-charcoal-900"
            }`}
          >
            {AD_PLATFORM_LABEL[p]}
          </button>
        ))}
      </div>

      {platform === "google" && (
        <div className="flex items-center gap-1 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === c ? "bg-[#C4788A] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {AD_REPORT_CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      )}

      <AdReportBulkSyncPanel
        key={`${platform}-${platform === "google" ? category : "acquisition"}`}
        storeId={store.id}
        storeName={store.name}
        platform={platform}
        category={platform === "google" ? category : "acquisition"}
        onSaved={refreshAdReports}
      />

      {(() => {
        const activeCategory = platform === "google" ? category : "acquisition";
        const currentReport = adReports.find(
          (r) => r.yearMonth === selectedMonth && r.platform === platform && r.category === activeCategory
        );
        if (!currentReport) return null;
        return <AdReportAnalysisSummary report={currentReport} history={adReports} monthlyHistory={history} />;
      })()}

      <AdReportForm
        key={`${selectedMonth}-${platform}-${platform === "google" ? category : "acquisition"}`}
        storeId={store.id}
        storeName={store.name}
        yearMonth={selectedMonth}
        platform={platform}
        category={platform === "google" ? category : "acquisition"}
        onSaved={refreshAdReports}
      />
    </div>
  );
}
