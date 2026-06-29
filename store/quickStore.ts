import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DiagnosisAnswers, DiagnosisResult } from "@/lib/types";
import { calculateQuickResult, QUICK_CATEGORIES } from "@/lib/quick-scoring";

interface QuickState {
  currentIndex: number;
  answers: DiagnosisAnswers;
  result: DiagnosisResult | null;
  isComplete: boolean;
  setAnswer: (questionId: string, value: number) => void;
  nextQuestion: () => void;
  completeAndCalculate: () => void;
  reset: () => void;
  getCurrentAnswer: () => number | undefined;
}

export const useQuickStore = create<QuickState>()(
  persist(
    (set, get) => ({
      currentIndex: 0,
      answers: {} as DiagnosisAnswers,
      result: null,
      isComplete: false,

      setAnswer: (questionId, value) => {
        set((state) => ({
          answers: { ...state.answers, [questionId]: value },
        }));
      },

      nextQuestion: () => {
        set((state) => ({ currentIndex: state.currentIndex + 1 }));
      },

      completeAndCalculate: () => {
        const { answers } = get();
        const result = calculateQuickResult(answers);
        set({ result, isComplete: true });
      },

      reset: () => {
        set({
          currentIndex: 0,
          answers: {} as DiagnosisAnswers,
          result: null,
          isComplete: false,
        });
      },

      getCurrentAnswer: () => {
        const { currentIndex, answers } = get();
        const question = QUICK_CATEGORIES[currentIndex]?.question;
        if (!question) return undefined;
        return answers[question.id];
      },
    }),
    {
      name: "salon-quick-diagnosis",
      partialize: (state) => ({
        currentIndex: state.currentIndex,
        answers: state.answers,
        result: state.result,
        isComplete: state.isComplete,
      }),
    }
  )
);
