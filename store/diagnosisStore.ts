import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DiagnosisAnswers, DiagnosisResult } from "@/lib/types";
import { calculateResult, getAllQuestions, CATEGORIES } from "@/lib/scoring";

interface DiagnosisState {
  currentQuestionIndex: number;
  answers: DiagnosisAnswers;
  result: DiagnosisResult | null;
  isComplete: boolean;
  // 成長データベースとの連携用（詳細診断のみ）。salonName/salonPhoneで店舗を照合する。
  salonName: string;
  salonPhone: string;
  linkedDiagnosisId: string | null;

  setAnswer: (questionId: string, value: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  completeAndCalculate: () => DiagnosisResult;
  setSalonInfo: (name: string, phone: string) => void;
  setLinkedDiagnosisId: (id: string) => void;
  reset: () => void;

  getCurrentQuestion: () => ReturnType<typeof getAllQuestions>[number] | null;
  getCurrentCategory: () => (typeof CATEGORIES)[number] | null;
  getTotalQuestions: () => number;
  getProgress: () => number;
  getCurrentAnswer: () => number | undefined;
}

const initialState = {
  currentQuestionIndex: 0,
  answers: {} as DiagnosisAnswers,
  result: null,
  isComplete: false,
  salonName: "",
  salonPhone: "",
  linkedDiagnosisId: null as string | null,
};

export const useDiagnosisStore = create<DiagnosisState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAnswer: (questionId, value) => {
        set((state) => ({
          answers: { ...state.answers, [questionId]: value },
        }));
      },

      nextQuestion: () => {
        const total = getAllQuestions().length;
        set((state) => ({
          currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, total - 1),
        }));
      },

      previousQuestion: () => {
        set((state) => ({
          currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
        }));
      },

      goToQuestion: (index) => {
        const total = getAllQuestions().length;
        set({ currentQuestionIndex: Math.max(0, Math.min(index, total - 1)) });
      },

      completeAndCalculate: () => {
        const { answers } = get();
        const result = calculateResult(answers);
        set({ result, isComplete: true });
        return result;
      },

      setSalonInfo: (name, phone) => {
        set({ salonName: name, salonPhone: phone });
      },

      setLinkedDiagnosisId: (id) => {
        set({ linkedDiagnosisId: id });
      },

      reset: () => {
        set({ ...initialState });
      },

      getCurrentQuestion: () => {
        const { currentQuestionIndex } = get();
        const questions = getAllQuestions();
        return questions[currentQuestionIndex] ?? null;
      },

      getCurrentCategory: () => {
        const question = get().getCurrentQuestion();
        if (!question) return null;
        return CATEGORIES.find((c) => c.id === question.categoryId) ?? null;
      },

      getTotalQuestions: () => getAllQuestions().length,

      getProgress: () => {
        const { currentQuestionIndex } = get();
        const total = getAllQuestions().length;
        return Math.round((currentQuestionIndex / total) * 100);
      },

      getCurrentAnswer: () => {
        const question = get().getCurrentQuestion();
        if (!question) return undefined;
        return get().answers[question.id];
      },
    }),
    {
      name: "salon-diagnosis",
      // 診断の進捗・回答・結果のみ永続化。アクション関数は除外
      partialize: (state) => ({
        currentQuestionIndex: state.currentQuestionIndex,
        answers: state.answers,
        result: state.result,
        isComplete: state.isComplete,
        salonName: state.salonName,
        salonPhone: state.salonPhone,
        linkedDiagnosisId: state.linkedDiagnosisId,
      }),
    }
  )
);
