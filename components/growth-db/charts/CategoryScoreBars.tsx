"use client";

import { motion } from "framer-motion";
import { GrowthCategoryScore } from "@/lib/growth-db/types";
import { GROWTH_CATEGORY_META } from "@/lib/growth-db/constants";
import CategoryIcon from "@/components/ui/CategoryIcon";

export default function CategoryScoreBars({ categoryScores }: { categoryScores: GrowthCategoryScore[] }) {
  return (
    <div className="space-y-4">
      {categoryScores.map((cs, i) => {
        const meta = GROWTH_CATEGORY_META[cs.categoryId];
        return (
          <motion.div
            key={cs.categoryId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${cs.color}18` }}
                >
                  <CategoryIcon icon={meta.icon} size={14} color={cs.color} strokeWidth={1.8} />
                </div>
                <span className="text-sm font-semibold text-charcoal-900">{cs.name}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold" style={{ color: cs.color }}>
                  {cs.score}
                </span>
                <span className="text-xs text-gray-400">/ {cs.maxScore}</span>
              </div>
            </div>

            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cs.color }}
                initial={{ width: 0 }}
                animate={{ width: `${cs.percentage}%` }}
                transition={{ delay: 0.15 + 0.08 * i, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
