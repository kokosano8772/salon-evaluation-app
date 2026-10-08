// プロ版のAI分析呼び出しに使うプロンプト。
//
// 従来はここでAIに「29項目をtrue/false判定して」と丸投げしていたが、スコアリングは
// ルールベース(rule-based-scorer.ts)＋クイズ回答(quiz-questions.ts/applyQuizAnswers)で
// 既に決定的に確定しているため、AIの役割は「確定済みのスコアをもとに、サマリー・
// 強み弱み・改善提案の文章を生成すること」だけに変わった（設計書34章により忠実に）。

import { AI_CHECK_CATEGORY_LABEL, AiCheckCategoryScore, AiCheckRecommendation, DiagnosisItem } from "./types";

export interface AiCheckAiResponse {
  summary: string;
  target: string;
  strengths: string[];
  weaknesses: string[];
  missingInformation: string[];
  recommendations: AiCheckRecommendation[];
  // AI検索実測機能（プロ版のオプトイン機能）用。同じ呼び出しのついでに生成することで
  // 追加のGemini呼び出しコストを発生させない。
  salonName: string;
  suggestedSearchQueries: string[];
}

export interface SiteDataForPrompt {
  url: string;
  pages: { url: string; title: string | null; headings: string[]; textExcerpt: string }[];
}

export function buildAiCheckPrompt(
  site: SiteDataForPrompt,
  totalScore: number,
  categoryScores: AiCheckCategoryScore[],
  items: DiagnosisItem[]
): string {
  const categorySummary = categoryScores
    .map((c) => `- ${AI_CHECK_CATEGORY_LABEL[c.categoryId]}: ${c.score}/${c.maxScore}点`)
    .join("\n");

  const weakItems = items
    .filter((i) => i.status === "fail" || i.status === "partial")
    .map((i) => `- [${AI_CHECK_CATEGORY_LABEL[i.categoryId]}] ${i.label}（${i.score}/${i.maxScore}点）`)
    .join("\n") || "（特に無し。ほぼ全項目で満点）";

  const pagesJson = JSON.stringify(
    site.pages.map((p) => ({ url: p.url, title: p.title, headings: p.headings, textExcerpt: p.textExcerpt })),
    null,
    0
  );

  return [
    "あなたは美容室のWebサイトを「AI検索（ChatGPT等の対話型AIにおすすめ候補として紹介されやすいか）」の観点で診断する専門家です。",
    "この美容室の診断スコアは既に確定しています。あなたの仕事はスコアを判定することではなく、",
    "確定済みのスコアとクロールしたサイト情報をもとに、店舗オーナー向けの分かりやすいコメントを生成することです。",
    "",
    `対象サイト: ${site.url}`,
    `総合スコア: ${totalScore}/100点`,
    "カテゴリ別スコア:",
    categorySummary,
    "",
    "特に点数が伸びなかった項目:",
    weakItems,
    "",
    `クロールしたページ情報（本文は抜粋）: ${pagesJson}`,
    "",
    "## 出力形式（厳密なJSON、説明文やコードブロック記法は付けないこと）",
    JSON.stringify(
      {
        summary: "美容室の特徴・AI検索対策の現状を3〜4文で要約した文章（確定済みスコアと矛盾しないこと）",
        target: "このサイトの情報から読み取れるメインターゲット層（年代・性別・悩み等）",
        strengths: ["スコアが高かった項目を踏まえた、AIが理解できている強みを箇条書きで2〜4個"],
        weaknesses: ["点数が伸びなかった項目を踏まえた、AIが理解できていない・情報不足な点を箇条書きで2〜4個"],
        missingInformation: ["情報として不足していると判断した項目を箇条書きで2〜5個"],
        recommendations: [
          {
            priority: "high",
            category: "カテゴリ名（例: 専門性）",
            problem: "問題点の説明（点数が伸びなかった項目を根拠にすること）",
            reason: "AIがその美容室を理解・推薦する上でなぜ問題かの説明",
            solution: "具体的な改善方法（ページ追加・コンテンツ内容など、与えられた情報から妥当な範囲で）",
          },
        ],
        salonName: "サイトから読み取れる正式な店舗名（会社名ではなく実際の屋号）",
        suggestedSearchQueries: [
          "この美容室が検索結果に出てきそうな、地域名＋得意分野を含む自然な質問文を2〜3個（例: 「名古屋市で白髪ぼかしが得意な美容室は？」）。与えられた情報から読み取れる地域・得意分野が無い場合は無理に作らず配列を少なくする",
        ],
      },
      null,
      2
    ),
    "",
    "recommendationsは「特に点数が伸びなかった項目」の中から優先度の高いもの順に最大5件、具体的な根拠のあるものだけを挙げてください。" +
      "与えられた情報に無い事実（実際には確認していない施術内容やクリエイティブの中身など）を捏造しないこと。" +
      "suggestedSearchQueriesも同様に、与えられた情報から読み取れる地域・得意分野のみを使い、無い情報は補わないこと。",
  ].join("\n");
}
