// プロ版（/ai-check/pro）のクイズ質問定義。
//
// 「人でないと分からない項目」だけをここに置く。サイトのクロール内容から
// AIが判定できる項目（「サイトに○○が書かれているか」系、24項目）は
// lib/ai-check/build-ai-check-prompt.tsのAI_JUDGED_ITEMSに戻し、確定診断の
// Gemini呼び出し（コメント生成と同じ1回）に判定させる。
// ここに残す7問は、クロールでは分からない情報（口コミ内容・他媒体との一致）か、
// 「AIからどう見えるか」そのものを聞く項目（H.カテゴリ）。
//
// lib/scoring.ts（価値診断）の Question と同じ考え方：options配列のインデックスが
// そのまま得点になる（例: maxScore=2なら3択で0/1/2点）。

import { AiCheckCategoryId } from "./types";

export interface QuizQuestion {
  id: string;
  categoryId: AiCheckCategoryId;
  maxScore: number;
  question: string;
  options: string[];
  optionDescriptions: string[];
}

const BINARY = ["いいえ", "はい"];
const SCALE3 = ["特に無い", "ある程度ある", "しっかりある"];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // G. Google・口コミ・外部情報（ルールベースでは永久にunknownだった2項目。
  // サイトのクロールでは分からない外部情報のため人力で確認する）
  {
    id: "g_review_content",
    categoryId: "google_reviews",
    maxScore: 2,
    question: "Googleの口コミに、具体的な施術内容について書かれたものはどのくらいありますか？",
    options: SCALE3,
    optionDescriptions: [
      "ほとんど無い",
      "いくつかある",
      "多くの口コミに施術内容が具体的に書かれている",
    ],
  },
  {
    id: "g_cross_platform_match",
    categoryId: "google_reviews",
    maxScore: 2,
    question: "Googleビジネスプロフィールや他の掲載サイト（ホットペッパー等）の店舗情報は、自社サイトと一致していますか？",
    options: SCALE3,
    optionDescriptions: [
      "確認していない／大きくズレている",
      "おおむね一致している",
      "住所・営業時間等すべて完全に一致している",
    ],
  },

  // H. AI検索対応度（5点、設計書16章のQ1〜Q5。「AIからどう見えるか」そのものを
  // 聞く項目のため、クロール判定ではなく自己評価として人力で確認する）
  {
    id: "h_q1_specialty",
    categoryId: "ai_search",
    maxScore: 1,
    question: "サイトを見ただけで「何が得意な美容室か」が伝わりますか？",
    options: BINARY,
    optionDescriptions: ["伝わらない", "伝わる"],
  },
  {
    id: "h_q2_recommend_for",
    categoryId: "ai_search",
    maxScore: 1,
    question: "サイトを見ただけで「誰（どんな人）におすすめの美容室か」が伝わりますか？",
    options: BINARY,
    optionDescriptions: ["伝わらない", "伝わる"],
  },
  {
    id: "h_q3_area",
    categoryId: "ai_search",
    maxScore: 1,
    question: "サイトを見ただけで「どの地域の美容室か」が伝わりますか？",
    options: BINARY,
    optionDescriptions: ["伝わらない", "伝わる"],
  },
  {
    id: "h_q4_concern",
    categoryId: "ai_search",
    maxScore: 1,
    question: "サイトを見ただけで「どんな悩みを解決できる美容室か」が伝わりますか？",
    options: BINARY,
    optionDescriptions: ["伝わらない", "伝わる"],
  },
  {
    id: "h_q5_differentiation",
    categoryId: "ai_search",
    maxScore: 1,
    question: "サイトを見ただけで「競合美容室との違い」が伝わりますか？",
    options: BINARY,
    optionDescriptions: ["伝わらない", "伝わる"],
  },
];
