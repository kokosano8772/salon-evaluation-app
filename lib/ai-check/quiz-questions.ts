// プロ版（/ai-check/pro）のクイズ質問定義。
//
// 「人でないと分からない項目」だけをここに置く。サイトのクロール内容から
// AIが判定できる項目（「サイトに○○が書かれているか」系、24項目）は
// lib/ai-check/build-ai-check-prompt.tsのAI_JUDGED_ITEMSに戻し、確定診断の
// Gemini呼び出し（コメント生成と同じ1回）に判定させる。
// ここに残す7問は、クロールでは分からない情報（口コミ内容・他媒体との一致・
// SNSの実際の更新頻度・問い合わせへの対応速度など）。
// 旧H.カテゴリ（「サイトを見ただけで○○が伝わるか」をオーナー自己評価させる5問）は
// 全問AI判定項目（a_specialty/a_target/a_area/c_concern_explained/b_differentiation）
// と内容が重複し、かつ自己申告は「伝わる」側に甘くなりがちだったため、サイトの
// クロールでは絶対に分からない運営の実態を問う5問に差し替えた（配点は従来通り
// ai_searchカテゴリ5点のまま）。
//
// lib/scoring.ts（価値診断）の Question と同じ考え方：options配列のインデックスが
// そのまま得点になる（例: maxScore=2なら3択で0/1/2点）。ただし選択肢を頻度帯等で
// 細かく分けつつ配点は閾値でまとめたい場合向けに、optionScores（index→得点の対応表）
// を任意で指定できる（省略時は従来通りindexがそのまま得点）。

import { AiCheckCategoryId } from "./types";

export interface QuizQuestion {
  id: string;
  categoryId: AiCheckCategoryId;
  maxScore: number;
  question: string;
  options: string[];
  optionDescriptions: string[];
  // 省略時はoptions配列のインデックスがそのまま得点（従来挙動）。
  optionScores?: number[];
}

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

  // H. AI検索対応度（5点）。サイトのクロールでは分からない、運営の実態を問う5問。
  {
    id: "sns_update_frequency",
    categoryId: "ai_search",
    maxScore: 1,
    question: "ブログやSNS（Instagram等）は、実際どのくらいの頻度で更新していますか？",
    options: ["ほとんど更新していない", "数か月に1回程度", "月1回程度", "月2〜3回程度", "週1回以上"],
    optionDescriptions: [
      "更新が止まっている、または非常に稀",
      "思い出した時にたまに更新する程度",
      "月1回くらいのペースで更新している",
      "コンスタントに更新できている",
      "頻繁に最新情報を発信している",
    ],
    optionScores: [0, 0, 1, 1, 1],
  },
  {
    id: "google_review_reply",
    categoryId: "ai_search",
    maxScore: 1,
    question: "Googleの口コミに返信をしていますか？",
    options: ["返信していない", "良い口コミにだけ返信している", "良い口コミ・改善点を指摘する口コミ問わず返信している"],
    optionDescriptions: [
      "口コミへの返信はしていない",
      "好意的な口コミには返信しているが、それ以外は未対応",
      "内容を問わず、お客様の声に返信する運用ができている",
    ],
    optionScores: [0, 1, 1],
  },
  {
    id: "gbp_maintenance",
    categoryId: "ai_search",
    maxScore: 1,
    question: "Googleビジネスプロフィールの情報（営業時間・写真・投稿など）を、定期的に確認・更新していますか？",
    options: ["ほとんど確認していない", "たまに確認している（半年に1回程度）", "定期的に確認・更新している（月1回以上）"],
    optionDescriptions: [
      "登録したきりで、その後はほぼ放置している",
      "気が向いた時にだけ確認・更新する程度",
      "月1回以上のペースで情報を見直し、最新の状態を保っている",
    ],
    optionScores: [0, 0, 1],
  },
  {
    id: "other_platform_maintenance",
    categoryId: "ai_search",
    maxScore: 1,
    question: "ホットペッパー等、Google以外の口コミ・掲載サイトの情報も定期的に確認していますか？",
    options: ["ほとんど確認していない", "たまに確認している（半年に1回程度）", "定期的に確認・更新している（月1回以上）"],
    optionDescriptions: [
      "掲載したきりで、その後はほぼ放置している",
      "気が向いた時にだけ確認・更新する程度",
      "月1回以上のペースで情報を見直し、最新の状態を保っている",
    ],
    optionScores: [0, 0, 1],
  },
  {
    id: "inquiry_response_speed",
    categoryId: "ai_search",
    maxScore: 1,
    question: "お問い合わせや予約の連絡には、だいたいどのくらいで返信していますか？",
    options: ["数日以上かかることが多い", "当日〜翌日中には返信している", "数時間以内に返信している"],
    optionDescriptions: [
      "対応が後回しになりがち",
      "遅くとも翌日中には必ず返信している",
      "気づいたらすぐ、スピーディーに対応している",
    ],
    optionScores: [0, 1, 1],
  },
];
