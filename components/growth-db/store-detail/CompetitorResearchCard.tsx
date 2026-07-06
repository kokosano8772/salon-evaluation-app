"use client";

import Link from "next/link";
import { ChevronRight, Swords } from "lucide-react";
import { useCompetitorSessions } from "@/lib/growth-db/competitor-hooks";

const MODE_LABEL: Record<"attraction" | "recruitment" | "both", string> = {
  attraction: "集客分析",
  recruitment: "求人分析",
  both: "集客・求人分析",
};

export default function CompetitorResearchCard({ storeId }: { storeId: string }) {
  const { items, loading } = useCompetitorSessions(storeId);
  const latest = items[0];

  return (
    <div className="card-luxury p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-medium text-gray-400 tracking-wide flex items-center gap-1.5">
          <Swords size={14} strokeWidth={2} />
          競合調査
        </p>
        <Link
          href={`/dashboard/stores/${storeId}/competitors`}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          競合分析を行う
          <ChevronRight size={13} />
        </Link>
      </div>

      {loading ? (
        <div className="h-10 rounded-lg bg-gray-50 animate-pulse" />
      ) : latest ? (
        <p className="text-sm text-gray-500">
          直近: {latest.region}（{MODE_LABEL[latest.mode]}・競合{latest.competitorCount}社）
          <span className="text-gray-400"> — {new Date(latest.updatedAt).toLocaleDateString("ja-JP")}更新</span>
        </p>
      ) : (
        <p className="text-sm text-gray-400">
          まだ競合調査を行っていません。同商圏のサロンと比較し、集客・求人の強み弱みを分析できます。
        </p>
      )}
    </div>
  );
}
