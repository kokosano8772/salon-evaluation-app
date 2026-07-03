"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCard from "@/components/dashboard/StatCard";
import StoreInfoPanel from "@/components/growth-db/store-detail/StoreInfoPanel";
import StoreScoreSummary from "@/components/growth-db/store-detail/StoreScoreSummary";
import YoyComparisonCard from "@/components/growth-db/store-detail/YoyComparisonCard";
import CategoryRankingList from "@/components/growth-db/store-detail/CategoryRankingList";
import ImprovementPointsList from "@/components/growth-db/store-detail/ImprovementPointsList";
import GrowthRadarChart from "@/components/growth-db/charts/GrowthRadarChart";
import CategoryScoreBars from "@/components/growth-db/charts/CategoryScoreBars";
import MonthlyTrendChart, { TrendPoint } from "@/components/growth-db/charts/MonthlyTrendChart";
import { useStore, useMonthlyMetrics } from "@/lib/growth-db/hooks";
import { calculateGrowthRate, calculateGrowthScore } from "@/lib/growth-db/scoring";
import { formatMonthLabel, shiftYearMonth } from "@/lib/growth-db/format";

export default function StoreDetailPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const { store, loading: storeLoading } = useStore(storeId);
  const { data: history, loading: historyLoading } = useMonthlyMetrics(storeId);

  const months = useMemo(() => history.map((m) => m.yearMonth), [history]);
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedMonth && months.length > 0) {
      setSelectedMonth(months[months.length - 1]);
    }
  }, [months, selectedMonth]);

  const loading = storeLoading || historyLoading;

  if (!loading && !store) {
    return (
      <div className="card-luxury p-12 text-center text-gray-400 text-sm">
        店舗が見つかりませんでした。
        <div className="mt-4">
          <Link href="/dashboard/stores" className="text-[#C4788A] font-semibold">
            店舗一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !store) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  if (months.length === 0 || !selectedMonth) {
    return (
      <div>
        <DashboardHeader
          title={store.name}
          breadcrumbs={[
            { label: "ダッシュボード", href: "/dashboard" },
            { label: "成長データベース", href: "/dashboard/stores" },
            { label: store.name },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          <StoreInfoPanel store={store} />
          <div className="card-luxury p-12 text-center text-gray-400 text-sm">
            まだ月次データがありません。
            <div className="mt-4">
              <Link
                href={`/dashboard/stores/${store.id}/data`}
                className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
              >
                月次データを入力する
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentScore = calculateGrowthScore(store.id, selectedMonth, history, store.staffCount);

  const currentIndex = months.indexOf(selectedMonth);
  const prevMonth = currentIndex > 0 ? months[currentIndex - 1] : null;
  const prevScore = prevMonth ? calculateGrowthScore(store.id, prevMonth, history, store.staffCount) : null;
  const growthRate = calculateGrowthRate(currentScore, prevScore);

  const yoyMonth = shiftYearMonth(selectedMonth, -12);
  const hasYoy = months.includes(yoyMonth);
  const yoyScore = hasYoy ? calculateGrowthScore(store.id, yoyMonth, history, store.staffCount) : null;

  const trendData: TrendPoint[] = months.map((ym) => ({
    yearMonth: ym,
    score: calculateGrowthScore(store.id, ym, history, store.staffCount).totalScore,
  }));

  const latestRevenue = history[currentIndex]?.revenue;

  return (
    <div>
      <DashboardHeader
        title={store.name}
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "成長データベース", href: "/dashboard/stores" },
          { label: store.name },
        ]}
        actions={
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#C4788A]"
          >
            {months.map((ym) => (
              <option key={ym} value={ym}>
                {formatMonthLabel(ym)}
              </option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        <StoreInfoPanel store={store} />

        <div className="space-y-6 min-w-0">
          <StoreScoreSummary totalScore={currentScore.totalScore} growthRate={growthRate} />

          {latestRevenue && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="総売上" value={`¥${latestRevenue.totalRevenue.toLocaleString("ja-JP")}`} />
              <StatCard label="総来店数" value={`${latestRevenue.totalVisits}名`} />
              <StatCard label="客単価" value={`¥${latestRevenue.averageUnitPrice.toLocaleString("ja-JP")}`} />
              <StatCard label="前年比" value={`${latestRevenue.yoyRate}%`} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-luxury p-5">
              <p className="text-xs font-medium text-gray-400 tracking-wide mb-2">カテゴリ別レーダー</p>
              <GrowthRadarChart categoryScores={currentScore.categoryScores} />
            </div>
            <div className="card-luxury p-5">
              <p className="text-xs font-medium text-gray-400 tracking-wide mb-4">カテゴリ別スコア</p>
              <CategoryScoreBars categoryScores={currentScore.categoryScores} />
            </div>
          </div>

          <div className="card-luxury p-5">
            <p className="text-xs font-medium text-gray-400 tracking-wide mb-2">月別推移</p>
            <MonthlyTrendChart data={trendData} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <YoyComparisonCard
              currentYearMonth={selectedMonth}
              currentScore={currentScore.totalScore}
              previousYearMonth={hasYoy ? yoyMonth : null}
              previousScore={yoyScore?.totalScore ?? null}
            />
            <CategoryRankingList categoryScores={currentScore.categoryScores} />
          </div>

          <ImprovementPointsList categoryScores={currentScore.categoryScores} />
        </div>
      </div>
    </div>
  );
}
