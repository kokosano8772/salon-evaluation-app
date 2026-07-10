"use client";

import { Check, ChevronRight, Globe, Loader2, Star } from "lucide-react";
import { SalonBasic } from "@/lib/competitor-research/types";

interface CompetitorSearchResultsProps {
  salons: SalonBasic[];
  total: number;
  hasMore: boolean;
  source: "hotpepper" | "google" | "mock";
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onLoadMore: () => void;
  onStartCompare: () => void;
  loadingMore?: boolean;
  preparing?: boolean;
}

const SOURCE_LABEL: Record<CompetitorSearchResultsProps["source"], string> = {
  google: "Google検索結果",
  hotpepper: "ホットペッパー検索結果",
  mock: "サンプルデータ（APIキー未設定のため）",
};

export default function CompetitorSearchResults({
  salons,
  total,
  hasMore,
  source,
  selectedIds,
  onToggle,
  onLoadMore,
  onStartCompare,
  loadingMore,
  preparing,
}: CompetitorSearchResultsProps) {
  if (salons.length === 0) {
    return (
      <div className="card-luxury p-12 text-center text-gray-400 text-sm">
        該当するサロンが見つかりませんでした。エリアや条件を変更して再検索してください。
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <p className="text-xs text-gray-400">
        {SOURCE_LABEL[source]} ／ {total}件中 {salons.length}件表示
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {salons.map((salon) => {
          const selected = selectedIds.has(salon.id);
          return (
            <button
              key={salon.id}
              onClick={() => onToggle(salon.id)}
              className={`card-luxury p-4 text-left transition-all ${
                selected ? "ring-2 ring-[#C4788A]" : "hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="font-semibold text-sm text-charcoal-900 leading-snug">{salon.name}</p>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    selected ? "bg-[#C4788A] border-[#C4788A]" : "border-gray-300"
                  }`}
                >
                  {selected && <Check size={12} strokeWidth={3} color="white" />}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-2">{salon.area}</p>
              {salon.rating > 0 && (
                <p className="text-xs text-amber-500 flex items-center gap-1 mb-1.5">
                  <Star size={11} fill="currentColor" strokeWidth={0} />
                  {salon.rating.toFixed(1)}（{salon.reviewCount}件）
                </p>
              )}
              {salon.website ? (
                <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <Globe size={10} strokeWidth={2} />
                  サイトあり（詳細項目を自動推定できます）
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Globe size={10} strokeWidth={2} />
                  サイトなし（手動入力のみ）
                </p>
              )}
            </button>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:border-[#C4788A]/50 disabled:opacity-50"
          >
            {loadingMore ? "読み込み中..." : "もっと見る"}
          </button>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
          <div className="card-luxury px-5 py-4 flex items-center gap-4 shadow-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-charcoal-900">{selectedIds.size}社を選択中</p>
              <p className="text-xs text-gray-400">
                {preparing ? "ウェブサイトから情報を推定中..." : "比較を開始します"}
              </p>
            </div>
            <button
              onClick={onStartCompare}
              disabled={preparing}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
            >
              {preparing ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              {preparing ? "準備中..." : "比較開始"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
