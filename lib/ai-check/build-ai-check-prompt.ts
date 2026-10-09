// プロ版のAI分析呼び出しに使うプロンプト。
//
// ルールベース(rule-based-scorer.ts)＋クイズ回答(quiz-questions.ts/applyQuizAnswers)で
// 確定した項目（48点分）を「ここまで確定済み」としてAIに提示し、AIにはその続き——
// クロール内容から判定できる項目（AI_JUDGED_ITEMS、24項目・52点分）のtrue/false判定と、
// それを踏まえたサマリー・強み弱み・改善提案の文章生成——をまとめて1回のGemini呼び出しで
// 行わせる（設計書34章「点数をAIに完全に任せない」ため、スコアリング自体は固定の配点表
// に従った決定的な変換（buildAiJudgedDiagnosisItems）で行い、AIはtrue/false判定のみ）。

import { AI_CHECK_CATEGORY_LABEL, AiCheckCategoryId, AiCheckRecommendation, DiagnosisItem, DiagnosisItemStatus } from "./types";

export interface AiJudgedItemDefinition {
  id: string;
  categoryId: AiCheckCategoryId;
  maxScore: number;
  label: string;
}

// 従来クイズ化していた項目のうち、「サイトに○○が書かれているか」という、
// クロールした本文をAIに読ませれば判定可能な24項目（店舗情報4/専門性6/
// メニュー5/コンテンツFAQ5/スタッフ4、合計52点）。
export const AI_JUDGED_ITEMS: AiJudgedItemDefinition[] = [
  { id: "a_concept", categoryId: "store_info", maxScore: 2, label: "お店のコンセプトや世界観が伝わる記載がある" },
  { id: "a_target", categoryId: "store_info", maxScore: 2, label: "ターゲット層（年代・性別・髪の悩みなど）が明確に書かれている" },
  { id: "a_specialty", categoryId: "store_info", maxScore: 2, label: "お店の得意分野（一番の強み）が一目で分かる" },
  { id: "a_one_sentence", categoryId: "store_info", maxScore: 2, label: "初めて見た人が「どんな美容室か」を一文で説明できるくらいの情報量がある" },

  { id: "b_menu_specialty", categoryId: "specialty", maxScore: 3, label: "「このメニューならうちが一番」と言える得意メニューが、こだわりや技術的な特徴まで詳しく紹介されている" },
  { id: "b_hair_concern_specialty", categoryId: "specialty", maxScore: 3, label: "得意な髪質や悩み（くせ毛・白髪・ダメージ毛など）への対応力が具体的に書かれている" },
  { id: "b_differentiation", categoryId: "specialty", maxScore: 3, label: "他店との違い（差別化ポイント）が具体的に書かれている" },
  { id: "b_unique_technique", categoryId: "specialty", maxScore: 2, label: "独自の施術・技術について、特徴やこだわりまで説明されている" },
  { id: "b_expertise_content", categoryId: "specialty", maxScore: 2, label: "髪や施術に関する専門的な知識を発信するコンテンツ（コラムや解説記事など）がある" },
  { id: "b_track_record", categoryId: "specialty", maxScore: 2, label: "専門性を裏付ける実績（コンテスト受賞・メディア掲載・経験年数など）が紹介されている" },

  { id: "c_menu_detail", categoryId: "menu", maxScore: 3, label: "各メニューについて、内容や特徴の詳しい説明がある" },
  { id: "c_concern_explained", categoryId: "menu", maxScore: 3, label: "各メニューが「どんな悩みを解決できるか」説明されている" },
  { id: "c_target_age", categoryId: "menu", maxScore: 2, label: "各メニューの対象年代が説明されている" },
  { id: "c_merit_explained", categoryId: "menu", maxScore: 2, label: "施術を受けるメリットが説明されている" },
  { id: "c_before_after", categoryId: "menu", maxScore: 2, label: "施術のBefore/After写真や実例が掲載されている" },

  { id: "e_concern_articles", categoryId: "content_faq", maxScore: 3, label: "髪の悩みを解決するためのお役立ち記事・コラムが充実している" },
  { id: "e_menu_articles", categoryId: "content_faq", maxScore: 2, label: "メニューについて詳しく解説する記事がある" },
  { id: "e_expert_commentary", categoryId: "content_faq", maxScore: 2, label: "美容師本人による専門的な解説・コメント（技術や薬剤の説明など）がある" },
  { id: "e_local_content", categoryId: "content_faq", maxScore: 1, label: "地域（エリア）に関連したコンテンツ（周辺情報やアクセス紹介など）がある" },
  { id: "e_case_studies", categoryId: "content_faq", maxScore: 2, label: "お客様の施術事例（Before/After含む）の紹介コンテンツが充実している" },

  { id: "f_staff_specialty", categoryId: "staff", maxScore: 2, label: "スタッフ一人ひとりの得意分野が紹介されている" },
  { id: "f_staff_credentials", categoryId: "staff", maxScore: 1, label: "スタッフの資格・経歴（経験年数など）が紹介されている" },
  { id: "f_track_record", categoryId: "staff", maxScore: 2, label: "スタッフの施術実績（担当人数・得意な施術の実績など）が紹介されている" },
  { id: "f_customer_cases", categoryId: "staff", maxScore: 2, label: "お客様の声や事例（インタビュー・口コミ紹介など）が掲載されている" },
];

export interface AiCheckAiResponse {
  // AI_JUDGED_ITEMSの各idに対するtrue/false判定
  items: Record<string, boolean>;
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

const STATUS_TEXT: Record<DiagnosisItemStatus, string> = {
  pass: "満たしている",
  fail: "満たしていない",
  partial: "一部満たしている",
  unknown: "確認できなかった",
};

export function buildAiCheckPrompt(site: SiteDataForPrompt, partialItems: DiagnosisItem[]): string {
  const partialScore = partialItems.reduce((sum, i) => sum + i.score, 0);
  const partialMax = partialItems.reduce((sum, i) => sum + i.maxScore, 0);

  const confirmedSummary = partialItems
    .map((i) => `- [${AI_CHECK_CATEGORY_LABEL[i.categoryId]}] ${i.label}（${i.score}/${i.maxScore}点・${STATUS_TEXT[i.status]}）`)
    .join("\n");

  const judgeTargets = AI_JUDGED_ITEMS
    .map((d) => `- id: "${d.id}" ／ カテゴリ: ${AI_CHECK_CATEGORY_LABEL[d.categoryId]} ／ 配点: ${d.maxScore}点 ／ 判定基準: ${d.label}`)
    .join("\n");

  const pagesJson = JSON.stringify(
    site.pages.map((p) => ({ url: p.url, title: p.title, headings: p.headings, textExcerpt: p.textExcerpt })),
    null,
    0
  );

  return [
    "あなたは美容室のWebサイトを「AI検索（ChatGPT等の対話型AIにおすすめ候補として紹介されやすいか）」の観点で診断する専門家です。",
    "このサイトは既にルールベース判定と店舗オーナーへの質問によって、以下の項目のスコアが確定しています。",
    "",
    `対象サイト: ${site.url}`,
    `確定済みスコア: ${partialScore}/${partialMax}点（このあとあなたの判定分が加わり100点満点になります）`,
    "確定済み項目:",
    confirmedSummary,
    "",
    `クロールしたページ情報（本文は抜粋）: ${pagesJson}`,
    "",
    "## あなたのタスク1: 以下の項目をtrue/falseで判定",
    "上記のクロールしたページ情報を根拠に、以下の項目それぞれについて「判定基準の内容がサイト本文に明確に書かれているか」を判定してください。" +
      "実際に書かれていることが文中から確認できる場合のみtrue、確認できない・書かれていない場合はfalseにしてください（憶測や一般的な美容室像でtrueにしないこと）。",
    judgeTargets,
    "",
    "## あなたのタスク2: 確定済み項目とタスク1の判定結果を踏まえたコメント生成",
    "スコアそのものを再計算する必要はありません（それは別の仕組みで決定的に行われます）。あなたの判定結果と確定済みの情報だけを根拠に、店舗オーナー向けの分かりやすいコメントを生成してください。",
    "",
    "## 出力形式（厳密なJSON、説明文やコードブロック記法は付けないこと）",
    JSON.stringify(
      {
        items: Object.fromEntries(AI_JUDGED_ITEMS.map((d, i) => [d.id, i % 2 === 0])),
        summary: "美容室の特徴・AI検索対策の現状を3〜4文で要約した文章（確定済み項目とタスク1の判定結果の両方と矛盾しないこと）",
        target: "このサイトの情報から読み取れるメインターゲット層（年代・性別・悩み等）",
        strengths: ["確定済み項目とタスク1の判定結果のうち、スコアが高かった・trueと判定した項目を踏まえた強みを箇条書きで2〜4個"],
        weaknesses: ["確定済み項目とタスク1の判定結果のうち、点数が伸びなかった・falseと判定した項目を踏まえた、AIが理解できていない・情報不足な点を箇条書きで2〜4個"],
        missingInformation: ["情報として不足していると判断した項目を箇条書きで2〜5個"],
        recommendations: [
          {
            priority: "high",
            category: "カテゴリ名（例: 専門性）",
            problem: "問題点の説明（点数が伸びなかった項目・falseと判定した項目を根拠にすること）",
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
    "itemsは上記の24項目すべてについて、JSONのbooleanであるtrueまたはfalseいずれかを必ず返してください（省略しないこと。" +
      "上記の出力例のitemsの値はJSON形式を示すためのダミーであり、実際の判定結果ではありません。\"true\"のような文字列ではなく、クオートの付かないJSONのboolean値で返すこと）。" +
      "recommendationsは点数が伸びなかった・falseと判定した項目の中から優先度の高いもの順に最大5件、具体的な根拠のあるものだけを挙げてください。" +
      "与えられた情報に無い事実（実際には確認していない施術内容やクリエイティブの中身など）を捏造しないこと。" +
      "suggestedSearchQueriesも同様に、与えられた情報から読み取れる地域・得意分野のみを使い、無い情報は補わないこと。",
  ].join("\n");
}
