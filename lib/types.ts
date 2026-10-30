export type Rank = "S" | "A" | "B" | "C" | "D";

export interface Question {
  id: string;
  categoryId: string;
  label: string;
  maxScore: number;
  hint?: string;
  options?: string[];
  optionDescriptions?: string[];
  scores?: number[];
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

// 改善提案の相談先。koko_design＝ココデザインが支援できる領域（Web・SNS・採用広報等）、
// dealer＝店販商品のディーラーに相談すべき領域、self＝サロン内で完結する領域。
export type ConsultTarget = "koko_design" | "dealer" | "self";

export interface Improvement {
  categoryId: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action: string;
  consultTarget: ConsultTarget;
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
