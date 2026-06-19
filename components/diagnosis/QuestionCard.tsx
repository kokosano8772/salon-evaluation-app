"use client";

import { motion } from "framer-motion";
import { Info, CheckCircle2 } from "lucide-react";
import { Question, Category } from "@/lib/types";
import CategoryIcon from "@/components/ui/CategoryIcon";

interface QuestionCardProps {
  question: Question;
  category: Category;
  currentAnswer: number | undefined;
  onAnswer: (value: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuestionCard({
  question,
  category,
  currentAnswer,
  onAnswer,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const options = question.options ?? [];

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full"
    >
      {/* Category Badge */}
      <div className="flex items-center gap-2 mb-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${category.color}18` }}
        >
          <CategoryIcon icon={category.icon} size={18} color={category.color} strokeWidth={1.8} />
        </div>
        <div>
          <p
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: category.color }}
          >
            {category.nameEn}
          </p>
          <p className="text-charcoal-900 font-semibold text-sm">
            {category.name}
          </p>
        </div>
        <span className="ml-auto text-gray-400 text-xs">
          {questionNumber} / {totalQuestions}
        </span>
      </div>

      {/* Question */}
      <div className="card-luxury p-6 mb-6">
        <h2
          className="text-charcoal-900 text-xl font-bold mb-2 leading-snug"
        >
          {question.label}
        </h2>
        {question.hint && (
          <p className="text-gray-500 text-xs leading-relaxed">
            {question.hint}
          </p>
        )}

        <div
          className="flex items-center gap-1 mt-4 text-xs font-medium"
          style={{ color: category.color }}
        >
          <Info size={12} strokeWidth={2} />
          <span>0〜{question.maxScore}点で評価</span>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option, index) => {
          const isSelected = currentAnswer === index;
          return (
            <motion.button
              key={index}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAnswer(index)}
              className="w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3"
              style={{
                borderColor: isSelected
                  ? category.color
                  : "transparent",
                backgroundColor: isSelected
                  ? `${category.color}14`
                  : "white",
              }}
            >
              {/* Score number */}
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? category.color : "#f0f0f0",
                  color: isSelected ? "white" : "#999",
                }}
              >
                {index}
              </div>

              {/* Option label + description */}
              <span className="flex-1 flex flex-col gap-0.5">
                <span
                  className="text-sm font-medium"
                  style={{
                    color: isSelected ? category.color : "#444",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  {option}
                </span>
                {question.optionDescriptions?.[index] && (
                  <span
                    className="text-xs leading-snug"
                    style={{ color: isSelected ? `${category.color}cc` : "#999" }}
                  >
                    {question.optionDescriptions[index]}
                  </span>
                )}
              </span>

              {/* Check */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <CheckCircle2
                    size={20}
                    strokeWidth={2}
                    color={category.color}
                  />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
