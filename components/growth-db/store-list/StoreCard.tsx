"use client";

import Link from "next/link";
import { MapPin, Users, Calendar } from "lucide-react";
import { Store } from "@/lib/growth-db/types";
import { useLatestGrowthScore } from "@/lib/growth-db/hooks";
import { formatMonthLabel, growthScoreColor } from "@/lib/growth-db/format";

export default function StoreCard({ store }: { store: Store }) {
  const { score, loading } = useLatestGrowthScore(store.id);

  return (
    <Link href={`/dashboard/stores/${store.id}`} className="card-luxury p-5 block hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-semibold text-charcoal-900 text-sm truncate">{store.name}</p>
          <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <MapPin size={12} strokeWidth={2} />
            {store.area}
          </p>
        </div>
        {!loading && score && (
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
            style={{ backgroundColor: `${growthScoreColor(score.totalScore)}14` }}
          >
            <span className="text-base font-bold tabular-nums" style={{ color: growthScoreColor(score.totalScore) }}>
              {score.totalScore}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users size={12} strokeWidth={2} />
          スタッフ{store.staffCount ?? "不明"}名
        </span>
        <span className="flex items-center gap-1">
          <Calendar size={12} strokeWidth={2} />
          {store.openedYear ?? "不明"}年開業
        </span>
      </div>

      <p className="text-[11px] text-gray-400 mt-3">
        最終更新: {formatMonthLabel(store.updatedAt.slice(0, 7))}
      </p>
    </Link>
  );
}
