"use client";

import Link from "next/link";
import { ChevronRight, Megaphone } from "lucide-react";
import { useAdReports } from "@/lib/growth-db/ad-report-hooks";
import { AD_PLATFORM_LABEL } from "@/lib/growth-db/ad-report-types";
import { formatMonthLabel, formatYen } from "@/lib/growth-db/format";

export default function AdReportCard({ storeId }: { storeId: string }) {
  const { items, loading } = useAdReports(storeId);
  const latest = [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];

  return (
    <div className="card-luxury p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-medium text-gray-400 tracking-wide flex items-center gap-1.5">
          <Megaphone size={14} strokeWidth={2} />
          広告レポート
        </p>
        <Link
          href={`/dashboard/stores/${storeId}/ads`}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          広告データを見る
          <ChevronRight size={13} />
        </Link>
      </div>

      {loading ? (
        <div className="h-10 rounded-lg bg-gray-50 animate-pulse" />
      ) : latest ? (
        <p className="text-sm text-gray-500">
          直近: {formatMonthLabel(latest.yearMonth)}・{AD_PLATFORM_LABEL[latest.platform]}（広告費 {formatYen(latest.spend)}）
          <span className="text-gray-400"> — {new Date(latest.updatedAt).toLocaleDateString("ja-JP")}更新</span>
        </p>
      ) : (
        <p className="text-sm text-gray-400">
          まだ広告データが登録されていません。Google広告・Meta広告の実績を月次で記録できます。
        </p>
      )}
    </div>
  );
}
