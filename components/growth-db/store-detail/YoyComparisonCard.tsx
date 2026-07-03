import { formatMonthLabel } from "@/lib/growth-db/format";

interface YoyComparisonCardProps {
  currentYearMonth: string;
  currentScore: number;
  previousYearMonth: string | null;
  previousScore: number | null;
}

export default function YoyComparisonCard({
  currentYearMonth,
  currentScore,
  previousYearMonth,
  previousScore,
}: YoyComparisonCardProps) {
  const hasComparison = previousYearMonth !== null && previousScore !== null;
  const diff = hasComparison ? currentScore - (previousScore as number) : null;
  const max = Math.max(currentScore, previousScore ?? 0, 1);

  return (
    <div className="card-luxury p-5">
      <p className="text-xs font-medium text-gray-400 tracking-wide mb-4">前年比較</p>

      {!hasComparison ? (
        <p className="text-sm text-gray-400">前年同月のデータがまだありません。</p>
      ) : (
        <>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{formatMonthLabel(currentYearMonth)}</span>
                <span className="font-semibold text-charcoal-900">{currentScore}点</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(currentScore / max) * 100}%`, backgroundColor: "#C4788A" }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{formatMonthLabel(previousYearMonth as string)}</span>
                <span className="font-semibold text-charcoal-500">{previousScore}点</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gray-300"
                  style={{ width: `${((previousScore as number) / max) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-sm mt-4">
            前年同月比{" "}
            <span className="font-bold" style={{ color: (diff ?? 0) >= 0 ? "#6BAB8A" : "#E08B6B" }}>
              {(diff ?? 0) >= 0 ? "+" : ""}
              {diff}点
            </span>
          </p>
        </>
      )}
    </div>
  );
}
