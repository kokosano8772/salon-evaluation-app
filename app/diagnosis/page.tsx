"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, RotateCcw } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { CATEGORIES } from "@/lib/scoring";
import QuestionCard from "@/components/diagnosis/QuestionCard";
import ProgressHeader from "@/components/diagnosis/ProgressHeader";
import CategoryIcon from "@/components/ui/CategoryIcon";

export default function DiagnosisPage() {
  const router = useRouter();
  const {
    currentQuestionIndex,
    answers,
    setAnswer,
    nextQuestion,
    previousQuestion,
    getCurrentQuestion,
    getCurrentCategory,
    getTotalQuestions,
    getCurrentAnswer,
    completeAndCalculate,
    reset,
  } = useDiagnosisStore();

  const [showCategoryIntro, setShowCategoryIntro] = useState(false);
  const [introCategory, setIntroCategory] = useState(CATEGORIES[0]);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const question = getCurrentQuestion();
  const category = getCurrentCategory();
  const totalQuestions = getTotalQuestions();
  const currentAnswer = getCurrentAnswer();
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  useEffect(() => {
    if (!question || !category) return;

    const isFirstInCategory = question.id === category.questions[0].id;
    if (isFirstInCategory && currentQuestionIndex > 0 && direction === "next") {
      setIntroCategory(category);
      setShowCategoryIntro(true);
      const timer = setTimeout(() => setShowCategoryIntro(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, question, category, direction]);

  if (!question || !category) return null;

  const handleAnswer = (value: number) => setAnswer(question.id, value);

  const handleNext = () => {
    if (currentAnswer === undefined) return;
    setDirection("next");
    if (isLastQuestion) {
      setIsAnalyzing(true);
      setTimeout(() => {
        completeAndCalculate();
        router.push("/result");
      }, 2200);
      return;
    }
    nextQuestion();
  };

  const handlePrev = () => {
    setDirection("prev");
    previousQuestion();
  };

  const isAnswered = currentAnswer !== undefined;

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F3] flex flex-col">
      <ProgressHeader
        currentIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        answers={answers}
      />

      {/* Analyzing Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backdropFilter: "blur(16px)", backgroundColor: "rgba(250,248,243,0.7)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 260, damping: 22 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Spinner rings */}
              <div className="relative w-20 h-20">
                <motion.div
                  className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: "rgba(201,168,76,0.2)" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: "#C4788A" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-3 rounded-full border border-transparent"
                  style={{ borderTopColor: "#DA9EAD", borderRightColor: "#DA9EAD" }}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#C4788A" }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
              </div>

              {/* Text */}
              <div className="text-center">
                <p className="text-charcoal-900 text-lg font-semibold tracking-widest mb-1">
                  診断中
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    ...
                  </motion.span>
                </p>
                <p className="text-gray-400 text-xs tracking-wider">あなたのサロンを分析しています</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Intro Overlay */}
      <AnimatePresence>
        {showCategoryIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(26,26,26,0.88)" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="text-center px-8"
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: `${introCategory.color}25` }}
              >
                <CategoryIcon
                  icon={introCategory.icon}
                  size={40}
                  color={introCategory.color}
                  strokeWidth={1.4}
                />
              </div>
              <p
                className="text-white text-3xl font-bold mb-2"
              >
                {introCategory.name}
              </p>
              <p className="text-gray-400 text-sm mb-3">{introCategory.nameEn}</p>
              <p className="text-gray-300 text-sm leading-relaxed">{introCategory.description}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 px-5 py-6 flex flex-col">
        <AnimatePresence mode="wait">
          <QuestionCard
            key={question.id}
            question={question}
            category={category}
            currentAnswer={currentAnswer}
            onAnswer={handleAnswer}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={totalQuestions}
          />
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 space-y-3">
          <motion.button
            onClick={handleNext}
            disabled={!isAnswered}
            whileTap={isAnswered ? { scale: 0.97 } : {}}
            className="w-full py-5 rounded-2xl font-semibold text-base tracking-wide transition-all duration-300 flex items-center justify-center gap-2"
            style={{
              background: isAnswered
                ? `linear-gradient(135deg, ${category.color} 0%, ${category.color}99 100%)`
                : "#e5e5e5",
              color: isAnswered ? "white" : "#aaa",
              boxShadow: isAnswered ? `0 8px 24px ${category.color}40` : "none",
            }}
          >
            {!isAnswered ? (
              "回答を選択してください"
            ) : isLastQuestion ? (
              <>
                診断結果を見る
                <ArrowRight size={18} strokeWidth={2} />
              </>
            ) : (
              <>
                次の質問へ
                <ArrowRight size={18} strokeWidth={2} />
              </>
            )}
          </motion.button>

          {!isFirstQuestion && (
            <button
              onClick={handlePrev}
              className="w-full py-3 rounded-xl text-gray-500 text-sm font-medium bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <ChevronLeft size={16} strokeWidth={1.8} />
              前の質問に戻る
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={reset}
            className="text-gray-400 text-xs flex items-center justify-center gap-1 mx-auto"
          >
            <RotateCcw size={11} strokeWidth={1.8} />
            最初からやり直す
          </button>
        </div>
      </main>
    </div>
  );
}
