"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MultiStoreTrendChart, { SERIES_COLORS, StoreSeries } from "@/components/growth-db/charts/MultiStoreTrendChart";
import * as repo from "@/lib/growth-db/repository";
import { calculateGrowthScore } from "@/lib/growth-db/scoring";
import { MonthlyMetrics, Store } from "@/lib/growth-db/types";

const MAX_SELECTION = 6;

export default function MonthlyAnalysisPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [historyByStore, setHistoryByStore] = useState<Record<string, MonthlyMetrics[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    repo.getStores({ pageSize: 1000, sortBy: "score", sortDir: "desc" }).then(({ items }) => {
      setStores(items);
      setSelectedIds(items.slice(0, 4).map((s) => s.id));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      selectedIds.map(async (id) => {
        const history = await repo.listMonthlyData(id);
        return [id, history] as const;
      })
    ).then((entries) => {
      if (!cancelled) setHistoryByStore(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [selectedIds]);

  const toggleStore = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, id];
    });
  };

  const months = useMemo(() => {
    const set = new Set<string>();
    Object.values(historyByStore).forEach((history) => history.forEach((m) => set.add(m.yearMonth)));
    return Array.from(set).sort();
  }, [historyByStore]);

  const series: StoreSeries[] = selectedIds
    .map((id) => stores.find((s) => s.id === id))
    .filter((s): s is Store => Boolean(s))
    .map((s) => ({ storeId: s.id, name: s.name }));

  const dataByStore = useMemo(() => {
    const result: Record<string, Record<string, number | undefined>> = {};
    for (const id of selectedIds) {
      const history = historyByStore[id];
      const store = stores.find((s) => s.id === id);
      if (!history || !store) continue;
      result[id] = Object.fromEntries(
        history.map((m) => [m.yearMonth, calculateGrowthScore(id, m.yearMonth, history, store.staffCount).totalScore])
      );
    }
    return result;
  }, [selectedIds, historyByStore, stores]);

  if (loading) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  return (
    <div>
      <DashboardHeader
        title="月次分析"
        description="複数店舗の総合スコア推移を比較できます（最大6店舗）"
        breadcrumbs={[{ label: "ダッシュボード", href: "/dashboard" }, { label: "月次分析" }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        <div className="card-luxury p-5">
          <p className="text-xs font-medium text-gray-400 tracking-wide mb-3">
            比較する店舗（{selectedIds.length}/{MAX_SELECTION}）
          </p>
          <div className="space-y-1 max-h-[520px] overflow-y-auto">
            {stores.map((store, i) => {
              const checked = selectedIds.includes(store.id);
              const colorIndex = selectedIds.indexOf(store.id);
              return (
                <label
                  key={store.id}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStore(store.id)}
                    disabled={!checked && selectedIds.length >= MAX_SELECTION}
                    className="w-4 h-4 rounded accent-[#C4788A]"
                  />
                  {checked && (
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: SERIES_COLORS[colorIndex % SERIES_COLORS.length] }}
                    />
                  )}
                  <span className="truncate text-charcoal-800">{store.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="card-luxury p-5">
          <p className="text-xs font-medium text-gray-400 tracking-wide mb-2">総合スコア推移</p>
          {series.length === 0 ? (
            <p className="text-sm text-gray-400 py-12 text-center">店舗を選択してください。</p>
          ) : (
            <MultiStoreTrendChart months={months} series={series} dataByStore={dataByStore} />
          )}
        </div>
      </div>
    </div>
  );
}
