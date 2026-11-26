"use client";

import Link from "next/link";
import { ChevronRight, Crown } from "lucide-react";
import { CompareResultRow } from "@/lib/web-ranking/store-ranking-client";

export default function StoreWebRankingResultList({ results }: { results: CompareResultRow[] }) {
  const ownRow = results.find((r) => r.isOwn);
  const ranked = results.filter((r) => r.rank !== null);
  const unranked = results.filter((r) => r.rank === null);

  return (
    <div className="space-y-6">
      {ownRow && (
        <div className="card-luxury p-5" style={{ background: "linear-gradient(135deg, #FDF2F5 0%, #FAF5F7 100%)" }}>
          {ownRow.rank != null ? (
            <p className="text-sm font-semibold text-charcoal-900">
              自社サイトはこの地域の{results.length}件中 <span className="text-[#A85E74] text-lg">{ownRow.rank}位</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">自社サイトはまだ診断結果がありません。</p>
          )}
        </div>
      )}

      {ranked.length > 0 && (
        <div className="space-y-2">
          {ranked.map((r) => (
            <div
              key={r.webAssetId}
              className={`card-luxury p-4 flex items-center gap-4 ${r.isOwn ? "ring-2 ring-[#C4788A]" : ""}`}
            >
              <div className="w-8 text-center flex-shrink-0">
                {r.rank === 1 ? (
                  <Crown size={20} className="text-amber-400 mx-auto" fill="currentColor" strokeWidth={0} />
                ) : (
                  <span className="text-lg font-bold text-gray-300">{r.rank}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-charcoal-900 flex items-center gap-1.5">
                  {r.salonName}
                  {r.isOwn && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white bg-[#C4788A]">自社</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 truncate">{r.url}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-charcoal-900">
                  {r.totalScore}/{r.totalMaxScore}点
                </p>
                {r.diagnosedAt && (
                  <p className="text-[11px] text-gray-400">{new Date(r.diagnosedAt).toLocaleDateString("ja-JP")}診断</p>
                )}
              </div>
              <Link
                href={`/dashboard/web-ranking/web-assets/${r.webAssetId}`}
                className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-[#C4788A] flex-shrink-0"
              >
                詳細
                <ChevronRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {unranked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 tracking-wide">未診断</p>
          {unranked.map((r) => (
            <div key={r.webAssetId} className="card-luxury p-4 flex items-center gap-4 opacity-70">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-charcoal-900 flex items-center gap-1.5">
                  {r.salonName}
                  {r.isOwn && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white bg-[#C4788A]">自社</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 truncate">{r.url}</p>
                {r.crawlError && <p className="text-[11px] text-red-500 mt-0.5">{r.crawlError}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
