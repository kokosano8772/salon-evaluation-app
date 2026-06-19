"use client";

import { motion } from "framer-motion";
import { CategoryScore } from "@/lib/types";
import { CATEGORIES } from "@/lib/scoring";
import CategoryIcon from "@/components/ui/CategoryIcon";

interface CategoryScoreBarProps {
  categoryScores: CategoryScore[];
}

export default function CategoryScoreBar({ categoryScores }: CategoryScoreBarProps) {
  return (
    <div className="space-y-4">
      {categoryScores.map((cs, i) => {
        const category = CATEGORIES.find((c) => c.id === cs.categoryId);
        return (
          <motion.div
            key={cs.categoryId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                {category && (
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${cs.color}18` }}
                  >
                    <CategoryIcon icon={category.icon} size={14} color={cs.color} strokeWidth={1.8} />
                  </div>
                )}
                <span className="text-sm font-semibold text-charcoal-900">
                  {cs.name}
                </span>
                <span className="text-xs text-gray-400">{cs.nameEn}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-base font-bold"
                  style={{ color: cs.color }}
                >
                  {cs.score}
                </span>
                <span className="text-xs text-gray-400">/ {cs.maxScore}</span>
              </div>
            </div>

            {/* Bar */}
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cs.color }}
                initial={{ width: 0 }}
                animate={{ width: `${cs.percentage}%` }}
                transition={{
                  delay: 0.2 + 0.1 * i,
                  duration: 0.8,
                  ease: "easeOut",
                }}
              />
            </div>

            {/* Percentage label */}
            <div className="flex justify-end mt-0.5">
              <span className="text-xs text-gray-400">{cs.percentage}%</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
