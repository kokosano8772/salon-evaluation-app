// プロ版（/ai-check/pro）のクイズ質問定義。
//
// 従来はAIに「クロールしたページを読んでtrue/falseを判定して」と丸投げしていた29項目
// （lib/ai-check/build-ai-check-prompt.tsのAI_JUDGED_ITEMS）と、ルールベースでは
// 永久にunknownのままだったG.カテゴリの残り2項目を、本人が選択肢から回答する
// 決定的な採点に置き換える（設計書34章「点数をAIに完全に任せない」により忠実にするため）。
// AIの役割はスコアリングではなく、確定済みスコアをもとにしたコメント文生成のみに変わる。
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
const SCALE4 = ["特に無い", "少しある", "ある程度ある", "しっかりある"];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // A. 店舗情報・AI理解度（残り8点分）
  {
    id: "a_concept",
    categoryId: "store_info",
    maxScore: 2,
    question: "お店のコンセプトや世界観は、サイトを見て伝わりますか？",
    options: SCALE3,
    optionDescriptions: [
      "コンセプトについて特に書いていない",
      "何となくは伝わるが具体的な言葉にはなっていない",
      "「〇〇な美容室」と一言で言えるコンセプトが明記されている",
    ],
  },
  {
    id: "a_target",
    categoryId: "store_info",
    maxScore: 2,
    question: "どんなお客様に来てほしいか（ターゲット層）は明確に書かれていますか？",
    options: SCALE3,
    optionDescriptions: [
      "年代・性別・悩みなど、ターゲットの記載が特に無い",
      "何となく想像はできるが、明記はされていない",
      "年代・性別・髪の悩みなど、ターゲットがはっきり書かれている",
    ],
  },
  {
    id: "a_specialty",
    categoryId: "store_info",
    maxScore: 2,
    question: "お店の得意分野（一番の強み）は一目で分かりますか？",
    options: SCALE3,
    optionDescriptions: [
      "強みと呼べる記載が特に無い",
      "メニュー表を見ればなんとなく分かる程度",
      "トップページ等で「得意分野」として明記されている",
    ],
  },
  {
    id: "a_one_sentence",
    categoryId: "store_info",
    maxScore: 2,
    question: "初めて見た人が「どんな美容室か」を一文で説明できるくらいの情報量がありますか？",
    options: SCALE3,
    optionDescriptions: [
      "店名とメニューくらいしか情報が無い",
      "ある程度の情報はあるが一文にまとめるには少し物足りない",
      "エリア・コンセプト・得意分野などが揃っており一文で説明できる",
    ],
  },

  // B. 専門性・独自性（15点）
  {
    id: "b_menu_specialty",
    categoryId: "specialty",
    maxScore: 3,
    question: "「このメニューならうちが一番」と言える得意メニューはどのくらい伝わっていますか？",
    options: SCALE4,
    optionDescriptions: [
      "得意メニューの紹介は特に無い",
      "メニュー名の記載だけはある",
      "簡単な説明付きで紹介されている",
      "こだわりや技術的な特徴まで詳しく紹介されている",
    ],
  },
  {
    id: "b_hair_concern_specialty",
    categoryId: "specialty",
    maxScore: 3,
    question: "得意な髪質や悩み（くせ毛・白髪・ダメージ毛など）への対応力はどのくらい伝わっていますか？",
    options: SCALE4,
    optionDescriptions: [
      "髪質・悩みへの対応について特に触れていない",
      "対応できる旨が一言だけ書いてある",
      "どんな髪質・悩みに対応できるか具体的に書いてある",
      "実例や技術名を交えて詳しく説明されている",
    ],
  },
  {
    id: "b_differentiation",
    categoryId: "specialty",
    maxScore: 3,
    question: "他店との違い（差別化ポイント）はどのくらい明確ですか？",
    options: SCALE4,
    optionDescriptions: [
      "他店との違いについて特に触れていない",
      "「こだわっています」程度の抽象的な表現のみ",
      "具体的な違いが1〜2点書かれている",
      "技術・実績・設備など複数の観点から明確に差別化されている",
    ],
  },
  {
    id: "b_unique_technique",
    categoryId: "specialty",
    maxScore: 2,
    question: "独自の施術・技術についての説明はありますか？",
    options: SCALE3,
    optionDescriptions: [
      "独自技術についての説明は無い",
      "技術名の記載はあるが説明は無い",
      "技術の特徴やこだわりまで説明されている",
    ],
  },
  {
    id: "b_expertise_content",
    categoryId: "specialty",
    maxScore: 2,
    question: "髪や施術に関する専門的な知識を発信していますか（コラムや解説記事など）？",
    options: SCALE3,
    optionDescriptions: [
      "専門知識の発信は特にしていない",
      "簡単な発信はあるがあまり専門的ではない",
      "専門知識をしっかり発信するコンテンツがある",
    ],
  },
  {
    id: "b_track_record",
    categoryId: "specialty",
    maxScore: 2,
    question: "専門性を裏付ける実績（コンテスト受賞・メディア掲載・経験年数など）は紹介されていますか？",
    options: SCALE3,
    optionDescriptions: [
      "実績の紹介は特に無い",
      "経験年数など簡単な情報はある",
      "受賞歴やメディア掲載など具体的な実績が紹介されている",
    ],
  },

  // C. メニュー・悩み解決情報（残り12点分）
  {
    id: "c_menu_detail",
    categoryId: "menu",
    maxScore: 3,
    question: "各メニューについて、内容や特徴の詳しい説明はありますか？",
    options: SCALE4,
    optionDescriptions: [
      "メニュー名と料金のみの記載",
      "一言程度の簡単な説明がある",
      "ある程度詳しい説明がある",
      "施術の流れや使用する薬剤まで詳しく説明されている",
    ],
  },
  {
    id: "c_concern_explained",
    categoryId: "menu",
    maxScore: 3,
    question: "各メニューが「どんな悩みを解決できるか」は説明されていますか？",
    options: SCALE4,
    optionDescriptions: [
      "悩みとの関連について特に説明が無い",
      "一部のメニューだけ触れている",
      "多くのメニューで悩みとの関連が説明されている",
      "全メニューで対象の悩みが明確に説明されている",
    ],
  },
  {
    id: "c_target_age",
    categoryId: "menu",
    maxScore: 2,
    question: "各メニューの対象年代は説明されていますか？",
    options: SCALE3,
    optionDescriptions: [
      "対象年代についての記載は無い",
      "一部のメニューで触れている程度",
      "多くのメニューで対象年代が明記されている",
    ],
  },
  {
    id: "c_merit_explained",
    categoryId: "menu",
    maxScore: 2,
    question: "施術を受けるメリットは説明されていますか？",
    options: SCALE3,
    optionDescriptions: [
      "メリットについての説明は特に無い",
      "簡単に触れている程度",
      "施術後の仕上がりやメリットがしっかり説明されている",
    ],
  },
  {
    id: "c_before_after",
    categoryId: "menu",
    maxScore: 2,
    question: "施術のBefore/After写真や実例は掲載されていますか？",
    options: SCALE3,
    optionDescriptions: [
      "掲載していない",
      "数件だけ掲載している",
      "複数の実例が分かりやすく掲載されている",
    ],
  },

  // E. コンテンツ・FAQ（残り10点分）
  {
    id: "e_concern_articles",
    categoryId: "content_faq",
    maxScore: 3,
    question: "髪の悩みを解決するためのお役立ち記事・コラムはありますか？",
    options: SCALE4,
    optionDescriptions: [
      "そのような記事は無い",
      "1〜2記事ある程度",
      "ある程度の記事数がある",
      "幅広い悩みをカバーする記事が充実している",
    ],
  },
  {
    id: "e_menu_articles",
    categoryId: "content_faq",
    maxScore: 2,
    question: "メニューについて詳しく解説する記事はありますか？",
    options: SCALE3,
    optionDescriptions: [
      "そのような記事は無い",
      "1〜2記事ある程度",
      "複数のメニューについて詳しく解説する記事がある",
    ],
  },
  {
    id: "e_expert_commentary",
    categoryId: "content_faq",
    maxScore: 2,
    question: "美容師本人による専門的な解説・コメント（技術や薬剤の説明など）はありますか？",
    options: SCALE3,
    optionDescriptions: [
      "そのようなコンテンツは無い",
      "簡単なコメント程度はある",
      "専門家としての解説がしっかり発信されている",
    ],
  },
  {
    id: "e_local_content",
    categoryId: "content_faq",
    maxScore: 1,
    question: "地域（エリア）に関連したコンテンツ（周辺情報やアクセス紹介など）はありますか？",
    options: BINARY,
    optionDescriptions: ["無い", "ある"],
  },
  {
    id: "e_case_studies",
    categoryId: "content_faq",
    maxScore: 2,
    question: "お客様の施術事例（Before/After含む）の紹介コンテンツは充実していますか？",
    options: SCALE3,
    optionDescriptions: [
      "事例紹介は特に無い",
      "数件程度ある",
      "多数の事例が分かりやすく紹介されている",
    ],
  },

  // F. スタッフ・実績・信頼性（残り7点分）
  {
    id: "f_staff_specialty",
    categoryId: "staff",
    maxScore: 2,
    question: "スタッフ一人ひとりの得意分野は紹介されていますか？",
    options: SCALE3,
    optionDescriptions: [
      "スタッフ紹介はあるが得意分野の記載は無い",
      "一部のスタッフのみ記載がある",
      "スタッフごとに得意分野が紹介されている",
    ],
  },
  {
    id: "f_staff_credentials",
    categoryId: "staff",
    maxScore: 1,
    question: "スタッフの資格・経歴（経験年数など）は紹介されていますか？",
    options: BINARY,
    optionDescriptions: ["紹介されていない", "紹介されている"],
  },
  {
    id: "f_track_record",
    categoryId: "staff",
    maxScore: 2,
    question: "スタッフの施術実績（担当人数・得意な施術の実績など）は紹介されていますか？",
    options: SCALE3,
    optionDescriptions: [
      "実績の紹介は特に無い",
      "簡単な実績の記載はある",
      "具体的な実績がしっかり紹介されている",
    ],
  },
  {
    id: "f_customer_cases",
    categoryId: "staff",
    maxScore: 2,
    question: "お客様の声や事例（インタビュー・口コミ紹介など）は掲載されていますか？",
    options: SCALE3,
    optionDescriptions: [
      "掲載していない",
      "数件程度掲載している",
      "多数のお客様の声・事例が掲載されている",
    ],
  },

  // G. Google・口コミ・外部情報（ルールベースでは永久にunknownだった残り2項目）
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

  // H. AI検索対応度（5点、設計書16章のQ1〜Q5）
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
