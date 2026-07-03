"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCircle2, Info, Zap } from "lucide-react";
import { useQuickStore } from "@/store/quickStore";
import { QUICK_CATEGORIES } from "@/lib/quick-scoring";
import CategoryIcon from "@/components/ui/CategoryIcon";

const TOTAL = QUICK_CATEGORIES.length;

export default function QuickDiagnosisPage() {
  const router = useRouter();
  const { currentIndex, setAnswer, nextQuestion, completeAndCalculate, getCurrentAnswer, reset, isComplete } =
    useQuickStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isComplete) router.replace("/quick/result");
  }, [isComplete, router]);

  const category = QUICK_CATEGORIES[currentIndex];
  const question = category?.question;
  const currentAnswer = getCurrentAnswer();
  const isLast = currentIndex === TOTAL - 1;

  const handleAnswer = (value: number) => {
    if (!question) return;
    setAnswer(question.id, value);
  };

  const handleNext = () => {
    if (currentAnswer === undefined) return;
    if (isLast) {
      setIsAnalyzing(true);
      setTimeout(() => {
        completeAndCalculate();
        router.push("/quick/result");
      }, 2200);
    } else {
      nextQuestion();
    }
  };

  const handleBack = () => {
    if (currentIndex === 0) router.push("/");
    else useQuickStore.setState({ currentIndex: currentIndex - 1 });
  };

  if (!category || !question) return null;

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F3] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between sticky top-0 z-40">
        <button onClick={handleBack} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={16} strokeWidth={1.8} />
          <span className="text-xs">戻る</span>
        </button>
        <div className="flex items-center gap-1.5">
          <Zap size={12} strokeWidth={2} className="text-[#C4788A]" />
          <p className="text-xs font-medium text-[#C4788A] tracking-widest uppercase">簡易診断</p>
        </div>
        <button onClick={() => { reset(); router.push("/"); }} className="text-gray-400 text-xs">
          中止
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-white px-5 pb-4 pt-2">
        <div className="flex gap-1.5">
          {QUICK_CATEGORIES.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor:
                  i < currentIndex
                    ? category.color
                    : i === currentIndex
                    ? `${category.color}88`
                    : "#e5e7eb",
              }}
            />
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-2">
          {currentIndex + 1} / {TOTAL}
        </p>
      </div>

      {/* Question */}
      <main className="flex-1 px-5 py-6 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col flex-1"
          >
            {/* Category badge */}
            <div className="flex items-center gap-2 mb-6">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${category.color}18` }}
              >
                <CategoryIcon icon={category.icon} size={18} color={category.color} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-xs font-medium tracking-widest uppercase" style={{ color: category.color }}>
                  {category.nameEn}
                </p>
                <p className="text-charcoal-900 font-semibold text-sm">{category.name}</p>
              </div>
            </div>

            {/* Question card */}
            <div className="card-luxury p-6 mb-6">
              <h2 className="text-charcoal-900 text-xl font-bold mb-2 leading-snug">{question.label}</h2>
              {question.hint && (
                <p className="text-gray-500 text-xs leading-relaxed">{question.hint}</p>
              )}
              <div
                className="flex items-center gap-1 mt-4 text-xs font-medium"
                style={{ color: category.color }}
              >
                <Info size={12} strokeWidth={2} />
                <span>{category.maxScore}点満点</span>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2 flex-1">
              {question.options.map((option, index) => {
                const isSelected = currentAnswer === index;
                return (
                  <motion.button
                    key={index}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(index)}
                    className="w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3"
                    style={{
                      borderColor: isSelected ? category.color : "transparent",
                      backgroundColor: isSelected ? `${category.color}14` : "white",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all duration-200"
                      style={{
                        backgroundColor: isSelected ? category.color : "#f0f0f0",
                        color: isSelected ? "white" : "#999",
                      }}
                    >
                      {index}
                    </div>
                    <span className="flex-1 flex flex-col gap-0.5">
                      <span
                        className="text-sm font-medium"
                        style={{ color: isSelected ? category.color : "#444", fontWeight: isSelected ? 600 : 400 }}
                      >
                        {option}
                      </span>
                      {question.optionDescriptions[index] && (
                        <span
                          className="text-xs leading-snug"
                          style={{ color: isSelected ? `${category.color}cc` : "#999" }}
                        >
                          {question.optionDescriptions[index]}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <CheckCircle2 size={20} strokeWidth={2} color={category.color} />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Next button */}
      <div className="px-5 pb-10 pt-4 bg-[#FAF8F3]">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          disabled={currentAnswer === undefined}
          className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40"
          style={{
            background: currentAnswer !== undefined
              ? `linear-gradient(135deg, ${category.color} 0%, #A85E74 100%)`
              : "#ccc",
          }}
        >
          <span>{isLast ? "診断結果を見る" : "次へ"}</span>
          <ChevronRight size={18} strokeWidth={2} />
        </motion.button>
      </div>

      {/* Analyzing overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            style={{ backdropFilter: "blur(16px)", backgroundColor: "rgba(250,248,243,0.7)" }}
          >
            <div className="relative flex items-center justify-center w-32 h-32 mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute w-32 h-32 rounded-full border-2 border-dashed"
                style={{ borderColor: "#C4788A44" }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute w-20 h-20 rounded-full border-2"
                style={{ borderColor: "#C4788A88" }}
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: "#C4788A" }}
              />
            </div>
            <motion.p
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="text-charcoal-900 font-semibold text-lg tracking-wider"
            >
              診断中
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                ...
              </motion.span>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
