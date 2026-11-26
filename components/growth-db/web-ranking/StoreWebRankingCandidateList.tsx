"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Loader2, Star } from "lucide-react";
import { DiscoverCandidate } from "@/lib/web-ranking/store-ranking-client";
import { MAX_COMPARISON_COMPETITORS, COMPARISON_SOFT_WARNING_THRESHOLD } from "@/lib/web-ranking/config";

interface StoreWebRankingCandidateListProps {
  candidates: DiscoverCandidate[];
  selectedWebsites: Set<string>;
  onToggle: (website: string) => void;
  onStart: () => void;
  preparing?: boolean;
}

export default function StoreWebRankingCandidateList({
  candidates,
  selectedWebsites,
  onToggle,
  onStart,
  preparing,
}: StoreWebRankingCandidateListProps) {
  const [sortBy, setSortBy] = useState<"relevance" | "reviews" | "rating">("relevance");

  const sorted = useMemo(() => {
    if (sortBy === "relevance") return candidates;
    const copy = [...candidates];
    if (sortBy === "reviews") copy.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
    if (sortBy === "rating") copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return copy;
  }, [candidates, sortBy]);

  if (candidates.length === 0) {
    return (
      <div className="card-luxury p-12 text-center text-gray-400 text-sm">
        公式サイトを持つ競合サロンが見つかりませんでした。エリアや条件を変更して再検索してください。
      </div>
    );
  }

  const atCap = selectedWebsites.size >= MAX_COMPARISON_COMPETITORS;

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-400">{candidates.length}件表示（公式サイトありのみ）</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">並び替え:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-2 py-1 rounded-lg border border-gray-200 text-xs"
          >
            <option value="relevance">関連度（デフォルト）</option>
            <option value="reviews">口コミ数が多い順</option>
            <option value="rating">評価が高い順</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((c) => {
          const selected = selectedWebsites.has(c.website);
          const disabled = !selected && atCap;
          return (
            <button
              key={c.website}
              onClick={() => !disabled && onToggle(c.website)}
              disabled={disabled}
              className={`card-luxury p-4 text-left transition-all ${
                selected ? "ring-2 ring-[#C4788A]" : disabled ? "opacity-40 cursor-not-allowed" : "hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="font-semibold text-sm text-charcoal-900 leading-snug">{c.name}</p>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    selected ? "bg-[#C4788A] border-[#C4788A]" : "border-gray-300"
                  }`}
                >
                  {selected && <Check size={12} strokeWidth={3} color="white" />}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-2">{c.area}</p>
              {c.rating > 0 && (
                <p className="text-xs text-amber-500 flex items-center gap-1 mb-1.5">
                  <Star size={11} fill="currentColor" strokeWidth={0} />
                  {c.rating.toFixed(1)}（{c.reviewCount}件）
                </p>
              )}
              {c.alreadyRegistered && <p className="text-[11px] text-emerald-600">登録済み</p>}
            </button>
          );
        })}
      </div>

      {selectedWebsites.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
          <div className="card-luxury px-5 py-4 flex items-center gap-4 shadow-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-charcoal-900">{selectedWebsites.size}社を選択中</p>
              {selectedWebsites.size > COMPARISON_SOFT_WARNING_THRESHOLD && (
                <p className="text-xs text-amber-600">
                  選択数が多いと診断に時間がかかります（最大{MAX_COMPARISON_COMPETITORS}件）
                </p>
              )}
              {preparing && <p className="text-xs text-gray-400">サイトを診断中...</p>}
            </div>
            <button
              onClick={onStart}
              disabled={preparing}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
            >
              {preparing ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              {preparing ? "診断中..." : "ランキングを作成"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
