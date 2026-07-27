"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, FileText, Plus } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AdReportForm from "@/components/growth-db/forms/AdReportForm";
import AdReportAnalysisSummary from "@/components/growth-db/ads/AdReportAnalysisSummary";
import { useStore, useMonthlyMetrics } from "@/lib/growth-db/hooks";
import { useAdReports } from "@/lib/growth-db/ad-report-hooks";
import { currentYearMonth, formatMonthLabel, shiftYearMonth } from "@/lib/growth-db/format";
import { AD_PLATFORM_LABEL, AdPlatform } from "@/lib/growth-db/ad-report-types";

const PLATFORMS: AdPlatform[] = ["google", "meta"];

export default function StoreAdsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const { store, loading: storeLoading } = useStore(storeId);
  const { data: history, loading: historyLoading } = useMonthlyMetrics(storeId);
  const { items: adReports, refresh: refreshAdReports } = useAdReports(storeId);

  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);
  const [platform, setPlatform] = useState<AdPlatform>("google");

  const months = history.map((m) => m.yearMonth);

  useEffect(() => {
    if (!selectedMonth && !historyLoading) {
      setSelectedMonth(months.length > 0 ? months[months.length - 1] : currentYearMonth());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyLoading, months.length]);

  if (storeLoading || historyLoading || !store || !selectedMonth) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  const suggestedNextMonth = shiftYearMonth(months[months.length - 1] ?? currentYearMonth(), 1);

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
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#C4788A]"
              >
                {months.map((ym) => (
                  <option key={ym} value={ym}>
                    {formatMonthLabel(ym)}
                  </option>
                ))}
                {!months.includes(selectedMonth) && (
                  <option value={selectedMonth}>{formatMonthLabel(selectedMonth)}（新規）</option>
                )}
              </select>
              <ChevronDown
                size={15}
                strokeWidth={2}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            <button
              onClick={() => setSelectedMonth(suggestedNextMonth)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-charcoal-700 hover:bg-gray-50"
            >
              <Plus size={15} strokeWidth={2} />
              {formatMonthLabel(suggestedNextMonth)}を追加
            </button>
            <Link
              href={`/dashboard/stores/${store.id}/ads/report?month=${selectedMonth}&platform=${platform}`}
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

      {(() => {
        const currentReport = adReports.find((r) => r.yearMonth === selectedMonth && r.platform === platform);
        if (!currentReport) return null;
        return <AdReportAnalysisSummary report={currentReport} history={adReports} monthlyHistory={history} />;
      })()}

      <AdReportForm
        key={`${selectedMonth}-${platform}`}
        storeId={store.id}
        storeName={store.name}
        yearMonth={selectedMonth}
        platform={platform}
        onSaved={refreshAdReports}
      />
    </div>
  );
}
