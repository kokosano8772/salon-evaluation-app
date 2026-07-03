import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { growthScoreColor, growthScoreLabel } from "@/lib/growth-db/format";

interface StoreScoreSummaryProps {
  totalScore: number;
  growthRate: number | null;
}

export default function StoreScoreSummary({ totalScore, growthRate }: StoreScoreSummaryProps) {
  const color = growthScoreColor(totalScore);
  const label = growthScoreLabel(totalScore);

  const GrowthIcon = growthRate === null || growthRate === 0 ? Minus : growthRate > 0 ? TrendingUp : TrendingDown;
  const growthColor = growthRate === null || growthRate === 0 ? "#999" : growthRate > 0 ? "#6BAB8A" : "#E08B6B";

  return (
    <div className="card-luxury p-6 flex items-center gap-6">
      <div className="flex items-baseline gap-1">
        <span className="text-5xl font-bold tabular-nums" style={{ color }}>
          {totalScore}
        </span>
        <span className="text-gray-400 text-sm">/ 100</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color }}>
          {label}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">ココデザイン独自診断（集客力・リピート力・ブランド力・採用力・組織力）</p>
        {growthRate !== null && (
          <div className="flex items-center gap-1 mt-2 text-sm font-semibold" style={{ color: growthColor }}>
            <GrowthIcon size={14} strokeWidth={2.2} />
            前月比 {growthRate > 0 ? "+" : ""}
            {growthRate}%
          </div>
        )}
      </div>
    </div>
  );
}
