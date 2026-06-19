"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Improvement } from "@/lib/types";
import { CATEGORIES } from "@/lib/scoring";
import CategoryIcon from "@/components/ui/CategoryIcon";

interface ImprovementCardProps {
  improvement: Improvement;
  index: number;
}

const PRIORITY_STYLES = {
  high: {
    label: "優先度：高",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    dot: "bg-red-400",
  },
  medium: {
    label: "優先度：中",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  low: {
    label: "優先度：低",
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
    dot: "bg-green-400",
  },
};

export default function ImprovementCard({ improvement, index }: ImprovementCardProps) {
  const priority = PRIORITY_STYLES[improvement.priority];
  const category = CATEGORIES.find((c) => c.id === improvement.categoryId);
  const color = category?.color ?? "#999";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.5 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          {/* Category chip */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: color }}
          >
            {category && (
              <CategoryIcon icon={category.icon} size={11} color="white" strokeWidth={2} />
            )}
            <span>{category?.name}</span>
          </div>

          {/* Priority chip */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${priority.bg} ${priority.text} border ${priority.border}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            {priority.label}
          </div>
        </div>

        <h3 className="text-charcoal-900 font-bold text-sm leading-snug mb-2">
          {improvement.title}
        </h3>
        <p className="text-gray-600 text-xs leading-relaxed">
          {improvement.description}
        </p>
      </div>

      {/* Action */}
      <div className="mx-4 mb-4 bg-[#FAF8F3] rounded-xl p-3">
        <div className="flex items-start gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: color }}
          >
            <Check size={10} strokeWidth={2.5} color="white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-charcoal-900 mb-0.5">
              今すぐできるアクション
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {improvement.action}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
