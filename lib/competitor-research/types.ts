// 競合調査機能専用の型定義。「salon investigation-app」から移植。
// 成長データベースの型（lib/growth-db/types.ts）とは独立させ、相互importしない。

export type AnalysisMode = "attraction" | "recruitment" | "both";

export type SalonGenre = "hair" | "eyelash" | "nail" | "total_beauty" | "other";

export interface SalonBasic {
  id: string;
  name: string;
  area: string;
  genre: SalonGenre;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  address?: string;
  phone?: string;
  website?: string;
  hotpepperUrl?: string;
  googleMapUrl?: string;
}

export interface AttractionData {
  priceRange?: string;
  popularMenus?: string[];
  couponCount?: number;
  reviewCount?: number;
  rating?: number;
  businessHours?: string;
  closedDays?: string;
  seatCount?: number;
  staffCount?: number;
  specialGenre?: string;
  ageTarget?: string;
  designTrend?: string;
  storeImage?: string;
  hasInstagram?: boolean;
  snsUpdateFrequency?: string;
  reservationFlow?: string;
  campaign?: string;
  strengths?: string;
  weaknesses?: string;
  features?: string;
}

export interface RecruitmentData {
  salary?: string;
  minimumGuarantee?: string;
  commissionRate?: string;
  holidayCount?: number;
  paidLeave?: boolean;
  businessHours?: string;
  overtime?: string;
  educationSystem?: string;
  training?: string;
  acceptsNewGraduates?: boolean;
  socialInsurance?: boolean;
  benefits?: string;
  maternityLeave?: boolean;
  nominationBack?: string;
  salesBack?: string;
  workStyle?: string;
  flexibleHours?: boolean;
  shortHours?: boolean;
  jobDescription?: string;
  desiredPersonality?: string;
  recruitmentFeatures?: string;
}

export interface SalonData extends SalonBasic {
  isOwn?: boolean;
  attraction?: AttractionData;
  recruitment?: RecruitmentData;
}

export type CellRating = "good" | "normal" | "bad" | "neutral";

export interface CellData {
  value: string;
  rating: CellRating;
  note?: string;
}

export type ComparisonData = Record<string, Record<string, CellData>>;

export interface ComparisonField {
  key: string;
  label: string;
  category: "attraction" | "recruitment" | "basic";
  type: "text" | "number" | "boolean" | "rating";
}

export const ATTRACTION_FIELDS: ComparisonField[] = [
  { key: "priceRange", label: "価格帯", category: "attraction", type: "text" },
  { key: "popularMenus", label: "人気メニュー", category: "attraction", type: "text" },
  { key: "couponCount", label: "クーポン数", category: "attraction", type: "number" },
  { key: "reviewCount", label: "口コミ件数", category: "attraction", type: "number" },
  { key: "rating", label: "評価", category: "attraction", type: "rating" },
  { key: "businessHours", label: "営業時間", category: "attraction", type: "text" },
  { key: "closedDays", label: "定休日", category: "attraction", type: "text" },
  { key: "seatCount", label: "席数", category: "attraction", type: "number" },
  { key: "staffCount", label: "スタッフ数", category: "attraction", type: "number" },
  { key: "specialGenre", label: "得意ジャンル", category: "attraction", type: "text" },
  { key: "ageTarget", label: "年代ターゲット", category: "attraction", type: "text" },
  { key: "designTrend", label: "デザイン傾向", category: "attraction", type: "text" },
  { key: "storeImage", label: "店舗イメージ", category: "attraction", type: "text" },
  { key: "hasInstagram", label: "Instagram有無", category: "attraction", type: "boolean" },
  { key: "snsUpdateFrequency", label: "SNS更新頻度", category: "attraction", type: "text" },
  { key: "reservationFlow", label: "予約導線", category: "attraction", type: "text" },
  { key: "campaign", label: "キャンペーン", category: "attraction", type: "text" },
  { key: "strengths", label: "強み", category: "attraction", type: "text" },
  { key: "weaknesses", label: "弱み", category: "attraction", type: "text" },
  { key: "features", label: "特徴", category: "attraction", type: "text" },
];

export const RECRUITMENT_FIELDS: ComparisonField[] = [
  { key: "salary", label: "給与", category: "recruitment", type: "text" },
  { key: "minimumGuarantee", label: "最低保証", category: "recruitment", type: "text" },
  { key: "commissionRate", label: "歩合率", category: "recruitment", type: "text" },
  { key: "holidayCount", label: "休日数", category: "recruitment", type: "number" },
  { key: "paidLeave", label: "有給", category: "recruitment", type: "boolean" },
  { key: "businessHours", label: "営業時間", category: "recruitment", type: "text" },
  { key: "overtime", label: "残業", category: "recruitment", type: "text" },
  { key: "educationSystem", label: "教育制度", category: "recruitment", type: "text" },
  { key: "training", label: "研修", category: "recruitment", type: "text" },
  { key: "acceptsNewGraduates", label: "未経験歓迎", category: "recruitment", type: "boolean" },
  { key: "socialInsurance", label: "社会保険", category: "recruitment", type: "boolean" },
  { key: "benefits", label: "福利厚生", category: "recruitment", type: "text" },
  { key: "maternityLeave", label: "産休育休", category: "recruitment", type: "boolean" },
  { key: "nominationBack", label: "指名バック", category: "recruitment", type: "text" },
  { key: "salesBack", label: "店販バック", category: "recruitment", type: "text" },
  { key: "workStyle", label: "勤務形態", category: "recruitment", type: "text" },
  { key: "flexibleHours", label: "フレックス", category: "recruitment", type: "boolean" },
  { key: "shortHours", label: "時短勤務", category: "recruitment", type: "boolean" },
  { key: "jobDescription", label: "仕事内容", category: "recruitment", type: "text" },
  { key: "desiredPersonality", label: "求める人物像", category: "recruitment", type: "text" },
  { key: "recruitmentFeatures", label: "求人文章の特徴", category: "recruitment", type: "text" },
];
