"use client";

import { motion } from "framer-motion";
import { GrowthCategoryScore } from "@/lib/growth-db/types";
import { buildGrowthImprovements } from "@/lib/growth-db/recommendations";
import { GROWTH_CATEGORY_META } from "@/lib/growth-db/constants";
import CategoryIcon from "@/components/ui/CategoryIcon";

const PRIORITY_STYLES = {
  high: { label: "優先度：高", bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  medium: { label: "優先度：中", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  low: { label: "優先度：低", bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
};

export default function ImprovementPointsList({ categoryScores }: { categoryScores: GrowthCategoryScore[] }) {
  const improvements = buildGrowthImprovements(categoryScores).slice(0, 3);

  return (
    <div>
      <p className="text-xs font-medium text-gray-400 tracking-wide mb-4">改善ポイント</p>
      <div className="space-y-3">
        {improvements.map((imp, i) => {
          const meta = GROWTH_CATEGORY_META[imp.categoryId];
          const priority = PRIORITY_STYLES[imp.priority];
          return (
            <motion.div
              key={imp.categoryId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i, duration: 0.4 }}
              className="bg-white rounded-2xl border border-gray-100 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: meta.color }}
                >
                  <CategoryIcon icon={meta.icon} size={11} color="white" strokeWidth={2} />
                  <span>{meta.name}</span>
                </div>
                <div
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${priority.bg} ${priority.text} border ${priority.border}`}
                >
                  {priority.label}
                </div>
              </div>
              <h3 className="text-charcoal-900 font-bold text-sm leading-snug mb-1.5">{imp.title}</h3>
              <p className="text-gray-600 text-xs leading-relaxed">{imp.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
