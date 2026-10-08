// AI判定項目の定義。ルールベース（rule-based-scorer.ts）で機械的に確定できない
// 「意味・専門性・内容の質」に関わる項目だけをここでAIに判定させる（設計書34章）。
// AIには各項目をtrue/falseで判定させるだけに留め、配点・合計計算はコード側で行う
// （AIに点数そのものを決めさせない、という設計書の要件を維持するため）。

import { AiCheckCategoryId, AiCheckRecommendation } from "./types";

export interface AiJudgedItemDef {
  id: string;
  categoryId: AiCheckCategoryId;
  label: string;
  maxScore: number;
}

export const AI_JUDGED_ITEMS: AiJudgedItemDef[] = [
  // A. 店舗情報・AI理解度（残り8点分）
  { id: "a_concept", categoryId: "store_info", label: "店舗コンセプトが明確", maxScore: 2 },
  { id: "a_target", categoryId: "store_info", label: "ターゲットが明確", maxScore: 2 },
  { id: "a_specialty", categoryId: "store_info", label: "得意分野が明確", maxScore: 2 },
  { id: "a_one_sentence", categoryId: "store_info", label: "AIが店舗を一文で説明できる情報量がある", maxScore: 2 },
  // B. 専門性・独自性（15点）
  { id: "b_menu_specialty", categoryId: "specialty", label: "得意メニューが明確", maxScore: 3 },
  { id: "b_hair_concern_specialty", categoryId: "specialty", label: "得意な髪質・悩みが明確", maxScore: 3 },
  { id: "b_differentiation", categoryId: "specialty", label: "競合との差別化が明確", maxScore: 3 },
  { id: "b_unique_technique", categoryId: "specialty", label: "独自の施術・技術説明がある", maxScore: 2 },
  { id: "b_expertise_content", categoryId: "specialty", label: "専門知識を発信している", maxScore: 2 },
  { id: "b_track_record", categoryId: "specialty", label: "専門性を裏付ける実績がある", maxScore: 2 },
  // C. メニュー・悩み解決情報（残り12点分）
  { id: "c_menu_detail", categoryId: "menu", label: "各メニューの詳細説明がある", maxScore: 3 },
  { id: "c_concern_explained", categoryId: "menu", label: "対象となる悩みが説明されている", maxScore: 3 },
  { id: "c_target_age", categoryId: "menu", label: "対象年代が説明されている", maxScore: 2 },
  { id: "c_merit_explained", categoryId: "menu", label: "施術の特徴・メリットが説明されている", maxScore: 2 },
  { id: "c_before_after", categoryId: "menu", label: "Before/After等の実例がある", maxScore: 2 },
  // E. コンテンツ・FAQ（残り10点分）
  { id: "e_concern_articles", categoryId: "content_faq", label: "悩み解決記事", maxScore: 3 },
  { id: "e_menu_articles", categoryId: "content_faq", label: "メニュー解説記事", maxScore: 2 },
  { id: "e_expert_commentary", categoryId: "content_faq", label: "美容師による専門解説", maxScore: 2 },
  { id: "e_local_content", categoryId: "content_faq", label: "地域関連コンテンツ", maxScore: 1 },
  { id: "e_case_studies", categoryId: "content_faq", label: "Before/After・事例紹介", maxScore: 2 },
  // F. スタッフ・実績・信頼性（残り7点分）
  { id: "f_staff_specialty", categoryId: "staff", label: "スタッフごとの得意分野", maxScore: 2 },
  { id: "f_staff_credentials", categoryId: "staff", label: "資格・経歴等", maxScore: 1 },
  { id: "f_track_record", categoryId: "staff", label: "施術実績", maxScore: 2 },
  { id: "f_customer_cases", categoryId: "staff", label: "お客様事例", maxScore: 2 },
  // H. AI検索対応度（5点、設計書16章のQ1〜Q5そのもの）
  { id: "h_q1_specialty", categoryId: "ai_search", label: "「何が得意な美容室」か明確に説明できるか", maxScore: 1 },
  { id: "h_q2_recommend_for", categoryId: "ai_search", label: "「誰におすすめの美容室か」を説明できるか", maxScore: 1 },
  { id: "h_q3_area", categoryId: "ai_search", label: "「どの地域の美容室か」を説明できるか", maxScore: 1 },
  { id: "h_q4_concern", categoryId: "ai_search", label: "「どんな悩みを解決できるか」を説明できるか", maxScore: 1 },
  { id: "h_q5_differentiation", categoryId: "ai_search", label: "競合美容室との差別化ポイントを説明できるか", maxScore: 1 },
];

export interface AiCheckAiResponse {
  items: Record<string, boolean>;
  summary: string;
  target: string;
  strengths: string[];
  weaknesses: string[];
  missingInformation: string[];
  recommendations: AiCheckRecommendation[];
}

export interface SiteDataForPrompt {
  url: string;
  pages: { url: string; title: string | null; headings: string[]; textExcerpt: string }[];
}

export function buildAiCheckPrompt(site: SiteDataForPrompt): string {
  const itemList = AI_JUDGED_ITEMS.map((i) => `- ${i.id}: ${i.label}`).join("\n");

  const pagesJson = JSON.stringify(
    site.pages.map((p) => ({ url: p.url, title: p.title, headings: p.headings, textExcerpt: p.textExcerpt })),
    null,
    0
  );

  return [
    "あなたは美容室のWebサイトを「AI検索（ChatGPT等の対話型AIが『近くのおすすめ美容室』として紹介できるか）」の観点で診断する専門家です。",
    "以下は、ある美容室のWebサイトをクロールして取得したページ情報です（本文は長すぎる場合に抜粋しています）。",
    "",
    `対象サイト: ${site.url}`,
    `取得ページ: ${pagesJson}`,
    "",
    "上記の情報「のみ」を根拠に、以下の各項目が満たされているかをtrue/falseで判定してください。",
    "情報が無いために判断できない項目は、無理にtrueと判定せずfalseにしてください（存在しないことの証明は不要、与えられた情報の範囲で判断すれば十分です）。",
    "",
    "## 判定項目",
    itemList,
    "",
    "## 出力形式（厳密なJSON、説明文やコードブロック記法は付けないこと）",
    JSON.stringify(
      {
        items: Object.fromEntries(AI_JUDGED_ITEMS.map((i) => [i.id, true])),
        summary: "美容室の特徴・AI検索対策の現状を3〜4文で要約した文章",
        target: "このサイトの情報から読み取れるメインターゲット層（年代・性別・悩み等）",
        strengths: ["AIが理解できている強みを箇条書きで2〜4個"],
        weaknesses: ["AIが理解できていない・情報不足な点を箇条書きで2〜4個"],
        missingInformation: ["情報として不足していると判断した項目を箇条書きで2〜5個"],
        recommendations: [
          {
            priority: "high",
            category: "カテゴリ名（例: 専門性）",
            problem: "問題点の説明",
            reason: "AIがその美容室を理解・推薦する上でなぜ問題かの説明",
            solution: "具体的な改善方法（ページ追加・コンテンツ内容など、与えられた情報から妥当な範囲で）",
          },
        ],
      },
      null,
      2
    ),
    "",
    "recommendationsは優先度の高いもの順に最大5件、具体的な根拠のあるものだけを挙げてください。" +
      "与えられた情報に無い事実（実際には確認していない施術内容やクリエイティブの中身など）を捏造しないこと。",
  ].join("\n");
}
