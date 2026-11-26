"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Globe } from "lucide-react";

interface OwnAssetState {
  salonId: string | null;
  webAssetId: string | null;
  latestRun: { totalScore: number | null; totalMaxScore: number | null; createdAt: string } | null;
}

export default function WebRankingCard({ storeId }: { storeId: string }) {
  const [state, setState] = useState<OwnAssetState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/web-ranking/store-ranking/own-asset?storeId=${storeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setState(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  return (
    <div className="card-luxury p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs font-medium text-gray-400 tracking-wide flex items-center gap-1.5">
          <Globe size={14} strokeWidth={2} />
          WEBランキング
        </p>
        <Link
          href={`/dashboard/stores/${storeId}/web-ranking`}
          className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          WEBランキングを見る
          <ChevronRight size={13} />
        </Link>
      </div>

      {loading ? (
        <div className="h-10 rounded-lg bg-gray-50 animate-pulse" />
      ) : state?.latestRun?.totalScore != null ? (
        <p className="text-sm text-gray-500">
          自社サイト最新スコア: {state.latestRun.totalScore}/{state.latestRun.totalMaxScore}点
          <span className="text-gray-400"> — {new Date(state.latestRun.createdAt).toLocaleDateString("ja-JP")}診断</span>
        </p>
      ) : state?.salonId ? (
        <p className="text-sm text-gray-400">自社サイトは登録済みです。まだ診断は実行されていません。</p>
      ) : (
        <p className="text-sm text-gray-400">
          まだWEBランキング診断を行っていません。自社サイトを地域の競合サイトと比較できます。
        </p>
      )}
    </div>
  );
}
