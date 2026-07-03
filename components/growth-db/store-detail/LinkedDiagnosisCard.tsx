"use client";

import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { useDiagnosisResults } from "@/lib/growth-db/hooks";
import * as repo from "@/lib/growth-db/repository";
import { formatMonthLabel } from "@/lib/growth-db/format";

// 詳細診断(/diagnosis)から連携された結果の参照カード。
// あくまで参考情報であり、独自診断スコア(GrowthScore)の計算には使用しない。
export default function LinkedDiagnosisCard({ storeId }: { storeId: string }) {
  const { items, loading, refresh } = useDiagnosisResults(storeId);

  if (loading || items.length === 0) return null;

  const handleMarkReviewed = async (id: string) => {
    await repo.markDiagnosisResultReviewed(id);
    refresh();
  };

  return (
    <div className="card-luxury p-5">
      <p className="text-xs font-medium text-gray-400 tracking-wide mb-4 flex items-center gap-1.5">
        <ClipboardCheck size={14} strokeWidth={2} />
        詳細診断の連携結果（参考情報・独自診断スコアには反映されません）
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-charcoal-900">
                {item.totalScore}点（{item.rank}ランク）
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatMonthLabel(item.completedAt.slice(0, 7))}実施
              </p>
            </div>
            {item.status === "pending" ? (
              <button
                onClick={() => handleMarkReviewed(item.id)}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200"
              >
                未確認
              </button>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                <CheckCircle2 size={12} strokeWidth={2} />
                確認済み
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
