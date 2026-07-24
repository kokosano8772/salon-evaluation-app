"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Printer } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AdReportDocument from "@/components/growth-db/ads/report/AdReportDocument";
import { useStore } from "@/lib/growth-db/hooks";
import { useAdReports } from "@/lib/growth-db/ad-report-hooks";
import { buildAgeGroupTrend, buildCtrTrend } from "@/lib/growth-db/ad-report-trend";
import { currentYearMonth, formatMonthLabel } from "@/lib/growth-db/format";
import { AD_PLATFORM_LABEL, AdPlatform } from "@/lib/growth-db/ad-report-types";

const PLATFORMS: AdPlatform[] = ["google", "meta"];

interface StoreAdReportPageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ month?: string; platform?: string }>;
}

export default function StoreAdReportPage({ params, searchParams }: StoreAdReportPageProps) {
  const { storeId } = use(params);
  const initial = use(searchParams);
  const { store, loading: storeLoading } = useStore(storeId);
  const { items: adReports, loading: reportsLoading } = useAdReports(storeId);

  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(initial.month);
  const [platform, setPlatform] = useState<AdPlatform>(
    initial.platform === "google" || initial.platform === "meta" ? initial.platform : "meta"
  );

  const platformReports = useMemo(
    () => adReports.filter((r) => r.platform === platform).sort((a, b) => (a.yearMonth < b.yearMonth ? -1 : 1)),
    [adReports, platform]
  );

  useEffect(() => {
    if (!selectedMonth && !reportsLoading) {
      setSelectedMonth(platformReports.length > 0 ? platformReports[platformReports.length - 1].yearMonth : currentYearMonth());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsLoading, platformReports.length]);

  if (storeLoading || reportsLoading || !store || !selectedMonth) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  const report = platformReports.find((r) => r.yearMonth === selectedMonth) ?? null;
  const ctrTrend = report ? buildCtrTrend(adReports, platform, selectedMonth) : [];
  const ageGroupTrend = report ? buildAgeGroupTrend(adReports, platform, selectedMonth) : [];

  return (
    <div>
      <div className="ad-report-print-hide">
        <DashboardHeader
          title={`${store.name} - 広告レポート`}
          breadcrumbs={[
            { label: "ダッシュボード", href: "/dashboard" },
            { label: "成長データベース", href: "/dashboard/stores" },
            { label: store.name, href: `/dashboard/stores/${store.id}` },
            { label: "広告レポート", href: `/dashboard/stores/${store.id}/ads` },
            { label: "レポート" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#C4788A]"
                >
                  {platformReports.map((r) => (
                    <option key={r.yearMonth} value={r.yearMonth}>
                      {formatMonthLabel(r.yearMonth)}
                    </option>
                  ))}
                  {!platformReports.some((r) => r.yearMonth === selectedMonth) && (
                    <option value={selectedMonth}>{formatMonthLabel(selectedMonth)}</option>
                  )}
                </select>
                <ChevronDown
                  size={15}
                  strokeWidth={2}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-charcoal-700 hover:bg-gray-50"
              >
                <Printer size={15} strokeWidth={2} />
                印刷 / PDF保存
              </button>
              <Link
                href={`/dashboard/stores/${store.id}/ads`}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-charcoal-700 hover:bg-gray-50"
              >
                入力に戻る
              </Link>
            </div>
          }
        />

        <div className="flex items-center gap-1 mb-6 border-b border-gray-100">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPlatform(p);
                setSelectedMonth(undefined);
              }}
              className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                platform === p ? "border-[#C4788A] text-[#C4788A]" : "border-transparent text-gray-400 hover:text-charcoal-900"
              }`}
            >
              {AD_PLATFORM_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {report ? (
        <AdReportDocument storeName={store.name} report={report} ctrTrend={ctrTrend} ageGroupTrend={ageGroupTrend} />
      ) : (
        <div className="card-luxury p-12 text-center text-sm text-gray-400">
          {formatMonthLabel(selectedMonth)}の{AD_PLATFORM_LABEL[platform]}データがまだ保存されていません。
          <Link href={`/dashboard/stores/${store.id}/ads`} className="block mt-2 font-medium" style={{ color: "#C4788A" }}>
            データを入力する
          </Link>
        </div>
      )}
    </div>
  );
}
