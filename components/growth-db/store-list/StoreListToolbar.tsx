"use client";

import Link from "next/link";
import { ChevronDown, Search, Plus } from "lucide-react";
import { AREAS } from "@/lib/growth-db/constants";
import { GetStoresParams } from "@/lib/growth-db/repository";

interface StoreListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  area: string;
  onAreaChange: (value: string) => void;
  googleAdsOnly: boolean;
  onGoogleAdsOnlyChange: (value: boolean) => void;
  metaAdsOnly: boolean;
  onMetaAdsOnlyChange: (value: boolean) => void;
  sortValue: string;
  onSortChange: (sortBy: GetStoresParams["sortBy"], sortDir: GetStoresParams["sortDir"]) => void;
}

const SORT_OPTIONS: { value: string; label: string; sortBy: GetStoresParams["sortBy"]; sortDir: GetStoresParams["sortDir"] }[] = [
  { value: "updatedAt-desc", label: "更新が新しい順", sortBy: "updatedAt", sortDir: "desc" },
  { value: "score-desc", label: "スコアが高い順", sortBy: "score", sortDir: "desc" },
  { value: "score-asc", label: "スコアが低い順", sortBy: "score", sortDir: "asc" },
  { value: "name-asc", label: "店舗名（あ→ん）", sortBy: "name", sortDir: "asc" },
  { value: "area-asc", label: "エリア順", sortBy: "area", sortDir: "asc" },
];

export default function StoreListToolbar({
  search,
  onSearchChange,
  area,
  onAreaChange,
  googleAdsOnly,
  onGoogleAdsOnlyChange,
  metaAdsOnly,
  onMetaAdsOnlyChange,
  sortValue,
  onSortChange,
}: StoreListToolbarProps) {
  return (
    <div className="mb-6">
    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
      <div className="relative flex-1 min-w-0">
        <Search size={16} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="店舗名で検索"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A] transition-colors"
        />
      </div>

      <div className="relative">
        <select
          value={area}
          onChange={(e) => onAreaChange(e.target.value)}
          className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#C4788A]"
        >
          <option value="">すべてのエリア</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <ChevronDown size={15} strokeWidth={2} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative">
        <select
          value={sortValue}
          onChange={(e) => {
            const opt = SORT_OPTIONS.find((o) => o.value === e.target.value);
            if (opt) onSortChange(opt.sortBy, opt.sortDir);
          }}
          className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#C4788A]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={15} strokeWidth={2} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      <Link
        href="/dashboard/stores/new"
        className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
      >
        <Plus size={16} strokeWidth={2.2} />
        店舗を追加
      </Link>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={() => onGoogleAdsOnlyChange(!googleAdsOnly)}
        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
          googleAdsOnly
            ? "bg-[#C4788A] text-white border-[#C4788A]"
            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
        }`}
      >
        Google広告実施中のみ
      </button>
      <button
        onClick={() => onMetaAdsOnlyChange(!metaAdsOnly)}
        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
          metaAdsOnly
            ? "bg-[#C4788A] text-white border-[#C4788A]"
            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
        }`}
      >
        インスタ広告実施中のみ
      </button>
    </div>
    </div>
  );
}
