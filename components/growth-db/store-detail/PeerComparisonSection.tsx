"use client";

import { Users, MapPin } from "lucide-react";
import { useComparisonData } from "@/lib/growth-db/hooks";
import { GrowthScore } from "@/lib/growth-db/types";

function ComparisonRow({
  label,
  ownScore,
  avgScore,
  maxScore,
  color,
}: {
  label: string;
  ownScore: number;
  avgScore: number;
  maxScore: number;
  color: string;
}) {
  return (
    <div className="mb-3.5 last:mb-0">
      <div className="flex items-center justify-between mb-1 text-xs">
        <span className="font-medium text-charcoal-800">{label}</span>
        <span className="text-gray-400">
          自店 <span className="font-semibold text-charcoal-900">{ownScore}</span> / 平均{" "}
          <span className="font-medium">{avgScore}</span>
          <span className="text-gray-300"> ({maxScore}点満点)</span>
        </span>
      </div>
      <div className="space-y-1">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, (ownScore / maxScore) * 100)}%`, backgroundColor: color }}
          />
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gray-300"
            style={{ width: `${Math.min(100, (avgScore / maxScore) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ComparisonGroup({
  icon,
  title,
  subtitle,
  own,
  average,
  storeCount,
  emptyMessage,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  own: GrowthScore | null;
  average: GrowthScore | null;
  storeCount: number;
  emptyMessage: string;
}) {
  return (
    <div className="card-luxury p-5">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-sm font-bold text-charcoal-900">{title}</p>
      </div>
      <p className="text-xs text-gray-400 mb-4">{subtitle}</p>

      {!own || !average || storeCount === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">{emptyMessage}</p>
      ) : (
        <>
          <ComparisonRow label="総合スコア" ownScore={own.totalScore} avgScore={average.totalScore} maxScore={100} color="#C4788A" />
          <div className="border-t border-gray-50 my-3" />
          {own.categoryScores.map((cs) => {
            const avgCategory = average.categoryScores.find((c) => c.categoryId === cs.categoryId);
            if (!avgCategory) return null;
            return (
              <ComparisonRow
                key={cs.categoryId}
                label={cs.name}
                ownScore={cs.score}
                avgScore={avgCategory.score}
                maxScore={cs.maxScore}
                color={cs.color}
              />
            );
          })}
          <div className="flex items-center gap-1.5 mt-4 text-[11px] text-gray-400">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C4788A" }} />
            自店
            <span className="w-2 h-2 rounded-full bg-gray-300 ml-3" />
            平均（{storeCount}店舗）
          </div>
        </>
      )}
    </div>
  );
}

export default function PeerComparisonSection({ storeId }: { storeId: string }) {
  const { data, loading } = useComparisonData(storeId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-luxury p-5 h-72 animate-pulse bg-gray-50" />
        <div className="card-luxury p-5 h-72 animate-pulse bg-gray-50" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ComparisonGroup
        icon={<Users size={15} strokeWidth={2} className="text-[#C4788A]" />}
        title="同規模店舗との比較"
        subtitle="スタッフ人数・客単価・商圏・店舗形態が近い店舗との平均"
        own={data.own}
        average={data.peerGroup.averageScore}
        storeCount={data.peerGroup.stores.length}
        emptyMessage="比較できる同規模店舗がまだありません"
      />
      <ComparisonGroup
        icon={<MapPin size={15} strokeWidth={2} className="text-[#7C9EB5]" />}
        title="地域平均との比較"
        subtitle={
          data.regionalGroup.label
            ? `${data.regionalGroup.label}（${data.regionalGroup.level === "municipality" ? "市区町村単位" : "都道府県単位"}）の平均`
            : "同じ地域の店舗の平均"
        }
        own={data.own}
        average={data.regionalGroup.averageScore}
        storeCount={data.regionalGroup.stores.length}
        emptyMessage="比較できる同じ地域の店舗がまだありません"
      />
    </div>
  );
}
