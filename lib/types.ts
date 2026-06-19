export type Rank = "S" | "A" | "B" | "C" | "D";

export interface Question {
  id: string;
  categoryId: string;
  label: string;
  maxScore: number;
  hint?: string;
  options?: string[];
  optionDescriptions?: string[];
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  maxScore: number;
  icon: string;
  color: string;
  questions: Question[];
  description: string;
}

export interface DiagnosisAnswers {
  [questionId: string]: number;
}

export interface CategoryScore {
  categoryId: string;
  name: string;
  nameEn: string;
  score: number;
  maxScore: number;
  percentage: number;
  color: string;
}

export interface DiagnosisResult {
  totalScore: number;
  rank: Rank;
  categoryScores: CategoryScore[];
  answers: DiagnosisAnswers;
  completedAt: string;
}

export interface Improvement {
  categoryId: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action: string;
}

export interface RankInfo {
  rank: Rank;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  minScore: number;
  maxScore: number;
}
