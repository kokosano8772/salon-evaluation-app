import { GrowthCategoryScore } from "@/lib/growth-db/types";
import { GROWTH_CATEGORY_META } from "@/lib/growth-db/constants";
import CategoryIcon from "@/components/ui/CategoryIcon";

export default function CategoryRankingList({ categoryScores }: { categoryScores: GrowthCategoryScore[] }) {
  const ranked = [...categoryScores].sort((a, b) => b.score - a.score);

  return (
    <div className="card-luxury p-5">
      <p className="text-xs font-medium text-gray-400 tracking-wide mb-4">カテゴリ順位</p>
      <div className="space-y-3">
        {ranked.map((cs, i) => {
          const meta = GROWTH_CATEGORY_META[cs.categoryId];
          return (
            <div key={cs.categoryId} className="flex items-center gap-3">
              <span className="w-5 text-sm font-bold text-gray-300 tabular-nums">{i + 1}</span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${cs.color}14` }}
              >
                <CategoryIcon icon={meta.icon} size={14} color={cs.color} strokeWidth={1.8} />
              </div>
              <span className="flex-1 text-sm font-medium text-charcoal-800">{cs.name}</span>
              <span className="text-sm font-bold tabular-nums" style={{ color: cs.color }}>
                {cs.score}
                <span className="text-xs text-gray-400 font-normal"> /{cs.maxScore}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
