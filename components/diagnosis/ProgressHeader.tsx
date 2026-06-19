"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORIES } from "@/lib/scoring";
import { DiagnosisAnswers } from "@/lib/types";

interface ProgressHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  answers: DiagnosisAnswers;
}

export default function ProgressHeader({
  currentIndex,
  totalQuestions,
  answers,
}: ProgressHeaderProps) {
  const progress = (currentIndex / totalQuestions) * 100;
  const answeredCount = Object.keys(answers).length;

  let questionCount = 0;
  let currentCategoryIndex = 0;
  for (let i = 0; i < CATEGORIES.length; i++) {
    questionCount += CATEGORIES[i].questions.length;
    if (currentIndex < questionCount) {
      currentCategoryIndex = i;
      break;
    }
  }
  const currentCategory = CATEGORIES[currentCategoryIndex];

  return (
    <div className="sticky top-0 z-50 bg-[#FAF8F3]/95 backdrop-blur-sm border-b border-gray-100 px-5 py-4">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <Link
          href="/"
          className="flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={1.8} />
          <span className="text-xs">戻る</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">{answeredCount}</span>
          <span className="text-xs text-gray-400">/</span>
          <span className="text-xs text-gray-400">{totalQuestions}問</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${currentCategory.color} 0%, ${currentCategory.color}cc 100%)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Category steps */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat, i) => {
          const isActive = i === currentCategoryIndex;
          const isPast = i < currentCategoryIndex;
          return (
            <div key={cat.id} className="flex items-center gap-1 flex-shrink-0">
              <div
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: isActive
                    ? cat.color
                    : isPast
                    ? `${cat.color}60`
                    : "#e0e0e0",
                  transform: isActive ? "scale(1.4)" : "scale(1)",
                }}
              />
              <span
                className="text-xs transition-all duration-300"
                style={{
                  color: isActive ? cat.color : isPast ? "#aaa" : "#ccc",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {cat.name}
              </span>
              {i < CATEGORIES.length - 1 && (
                <ChevronRight size={10} strokeWidth={1.5} className="opacity-25 mx-0.5" color="#666" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
