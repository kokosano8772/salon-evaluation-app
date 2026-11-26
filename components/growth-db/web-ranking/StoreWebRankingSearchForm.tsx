"use client";

import { Search } from "lucide-react";
import { SalonGenre } from "@/lib/competitor-research/types";

const GENRE_OPTIONS: { id: SalonGenre | "all"; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "hair", label: "美容室" },
  { id: "eyelash", label: "アイラッシュ" },
  { id: "nail", label: "ネイル" },
  { id: "total_beauty", label: "トータルビューティー" },
];

interface StoreWebRankingSearchFormProps {
  region: string;
  onRegionChange: (v: string) => void;
  genre: SalonGenre | "all";
  onGenreChange: (v: SalonGenre | "all") => void;
  onSearch: () => void;
  loading?: boolean;
}

export default function StoreWebRankingSearchForm({
  region,
  onRegionChange,
  genre,
  onGenreChange,
  onSearch,
  loading,
}: StoreWebRankingSearchFormProps) {
  return (
    <div className="card-luxury p-6 space-y-5">
      <div>
        <p className="text-xs font-medium text-gray-400 tracking-wide mb-2">調査エリア</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            placeholder="例: 東京都渋谷区"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A] transition-colors"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-400 tracking-wide mb-2">業態フィルタ</p>
        <div className="flex flex-wrap gap-1.5">
          {GENRE_OPTIONS.map((g) => (
            <button
              key={g.id}
              onClick={() => onGenreChange(g.id)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                genre === g.id
                  ? "bg-[#C4788A] border-[#C4788A] text-white"
                  : "border-gray-200 text-gray-500 hover:border-[#C4788A]/50"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onSearch}
        disabled={loading || !region.trim()}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
      >
        <Search size={15} strokeWidth={2} />
        {loading ? "検索中..." : "地域の競合サイトを検索する"}
      </button>
    </div>
  );
}
