"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Download, Printer } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AdReportDocument from "@/components/growth-db/ads/report/AdReportDocument";
import GoogleAdReportDocument from "@/components/growth-db/ads/report/GoogleAdReportDocument";
import AdReportAIPanel from "@/components/growth-db/ads/AdReportAIPanel";
import { useMonthlyMetrics, useStore } from "@/lib/growth-db/hooks";
import { useAdReports } from "@/lib/growth-db/ad-report-hooks";
import { buildAgeGroupTrend, buildCtrTrend, buildYoyTrend } from "@/lib/growth-db/ad-report-trend";
import { currentYearMonth, formatMonthLabel, shiftYearMonth } from "@/lib/growth-db/format";
import { AD_PLATFORM_LABEL, AD_REPORT_CATEGORY_LABEL, AdPlatform, AdReportCategory } from "@/lib/growth-db/ad-report-types";

const PLATFORMS: AdPlatform[] = ["google", "meta"];
const CATEGORIES: AdReportCategory[] = ["acquisition", "recruitment"];

interface StoreAdReportPageProps {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ month?: string; platform?: string; category?: string }>;
}

export default function StoreAdReportPage({ params, searchParams }: StoreAdReportPageProps) {
  const { storeId } = use(params);
  const initial = use(searchParams);
  const { store, loading: storeLoading } = useStore(storeId);
  const { items: adReports, loading: reportsLoading, refresh: refreshAdReports } = useAdReports(storeId);
  const { data: monthlyHistory } = useMonthlyMetrics(storeId);

  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(initial.month);
  const [platform, setPlatform] = useState<AdPlatform>(
    initial.platform === "google" || initial.platform === "meta" ? initial.platform : "meta"
  );
  // 集客/求人の区分はGoogle広告のみで使う（Metaは常に集客扱い）
  const [category, setCategory] = useState<AdReportCategory>(
    initial.category === "recruitment" ? "recruitment" : "acquisition"
  );
  const platformReports = useMemo(
    () =>
      adReports
        .filter((r) => r.platform === platform && r.category === category)
        .sort((a, b) => (a.yearMonth < b.yearMonth ? -1 : 1)),
    [adReports, platform, category]
  );

  useEffect(() => {
    if (!selectedMonth && !reportsLoading) {
      // 広告レポートは前月分を見るのが基本のため、データが無い場合は当月ではなく前月をデフォルトにする
      setSelectedMonth(
        platformReports.length > 0 ? platformReports[platformReports.length - 1].yearMonth : shiftYearMonth(currentYearMonth(), -1)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportsLoading, platformReports.length, category]);

  if (storeLoading || reportsLoading || !store || !selectedMonth) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  const report = platformReports.find((r) => r.yearMonth === selectedMonth) ?? null;
  const ctrTrend = report && platform === "meta" ? buildCtrTrend(adReports, platform, selectedMonth) : [];
  const ageGroupTrend = report && platform === "meta" ? buildAgeGroupTrend(adReports, platform, selectedMonth) : [];

  // Google広告のみ: 広告開始月を基準にした1年サイクルでの前年同期比較トレンド
  const yoyTrend =
    report && platform === "google"
      ? buildYoyTrend(adReports, platform, category, selectedMonth)
      : { previousCycleLabel: "", currentCycleLabel: "", previousCycle: [], currentCycle: [] };

  // 印刷/PDF保存ダイアログが提示するファイル名候補はdocument.titleから決まるため、
  // 印刷直前だけ「店舗名-広告レポート-YYYYMM」に差し替え、閉じたら元に戻す。
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${store.name}-広告レポート-${selectedMonth.replace("-", "")}`;

    // GoogleレポートはMeta用の固定ページ高(9.375in×14.58in=900×1400px)を前提にしていないため、
    // 印刷時に実際のカード高さを測って@pageを上書きし、印刷結果の下部が余白だらけにならないようにする。
    // @pageは1ページ目・2ページ目に対して同じ高さが適用される（Chromeはページ毎に異なる
    // @pageサイズを安定してサポートしていない）ため、2ページの高さが違うと短い方に余白が
    // 残ってしまう。そこで先に短い方のページへ一時的にmin-heightを当てて高さを揃えてから、
    // その揃えた高さを@pageに指定する。
    let printSizeStyle: HTMLStyleElement | null = null;
    const heightOverrides: { el: HTMLElement; original: string }[] = [];
    if (platform === "google") {
      const pages = Array.from(document.querySelectorAll<HTMLElement>(".ad-report-page"));
      const maxHeight = Math.max(0, ...pages.map((el) => el.offsetHeight));
      if (maxHeight > 0) {
        pages.forEach((el) => {
          if (el.offsetHeight < maxHeight) {
            heightOverrides.push({ el, original: el.style.minHeight });
            el.style.minHeight = `${maxHeight}px`;
          }
        });
        // 画面表示と印刷時のレンダリング差で1px単位で足りず中身がはみ出すことがある
        // ため、視認できない程度の最小限のマージンだけ付けておく。
        const printHeight = maxHeight + 3;
        printSizeStyle = document.createElement("style");
        printSizeStyle.textContent = `@media print { @page { size: 900px ${printHeight}px; margin: 0; } }`;
        document.head.appendChild(printSizeStyle);
      }
    }

    const restoreTitle = () => {
      document.title = originalTitle;
      printSizeStyle?.remove();
      heightOverrides.forEach(({ el, original }) => {
        el.style.minHeight = original;
      });
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.print();
  };

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
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-charcoal-700 hover:bg-gray-50"
              >
                <Printer size={15} strokeWidth={2} />
                印刷
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-charcoal-700 hover:bg-gray-50"
              >
                <Download size={15} strokeWidth={2} />
                PDFで保存
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

        <div className="flex items-center gap-1 mb-3 border-b border-gray-100">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => {
                if (p === platform) return;
                setPlatform(p);
                setCategory("acquisition");
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

        {platform === "google" && (
          <div className="flex items-center gap-1 mb-6">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  if (c === category) return;
                  setCategory(c);
                  setSelectedMonth(undefined);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  category === c ? "bg-[#C4788A] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {AD_REPORT_CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        )}
      </div>

      {report ? (
        <>
          <AdReportAIPanel
            storeId={store.id}
            platform={platform}
            report={report}
            history={adReports}
            monthlyHistory={monthlyHistory}
            onSaved={refreshAdReports}
          />
          <div className="overflow-x-auto">
            {platform === "google" ? (
              <GoogleAdReportDocument
                storeName={store.name}
                businessCategory={store.businessCategory}
                report={report}
                trend={yoyTrend}
              />
            ) : (
              <AdReportDocument storeName={store.name} report={report} ctrTrend={ctrTrend} ageGroupTrend={ageGroupTrend} />
            )}
          </div>
        </>
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
