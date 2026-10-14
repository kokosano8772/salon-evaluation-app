import { HP_AI_JUDGED_ITEMS } from "./ai-judged-items";

export interface RankingSiteDataForPrompt {
  url: string;
  pages: { url: string; title: string | null; headings: string[]; textExcerpt: string }[];
}

export interface RankingAiResponse {
  items: Record<string, boolean>;
}

export function buildHpRankingPrompt(site: RankingSiteDataForPrompt): string {
  const judgeTargets = HP_AI_JUDGED_ITEMS.map(
    (d) => `- id: "${d.itemKey}" ／ カテゴリ: ${d.category} ／ 配点: ${d.maxScore}点 ／ 判定基準: ${d.label}`
  ).join("\n");

  const pagesJson = JSON.stringify(
    site.pages.map((p) => ({ url: p.url, title: p.title, headings: p.headings, textExcerpt: p.textExcerpt })),
    null,
    0
  );

  return [
    "あなたは美容室のWebサイトを、集客力・採用力の観点で評価する専門家です。",
    `対象サイト: ${site.url}`,
    `クロールしたページ情報（本文は抜粋）: ${pagesJson}`,
    "",
    "## タスク: 以下の項目をtrue/falseで判定",
    "上記のクロール結果を根拠に、以下の項目それぞれについて判定基準の内容がサイトから確認できるかを判定してください。" +
      "実際に確認できる場合のみtrue、確認できない場合はfalseにしてください（憶測でtrueにしないこと）。",
    judgeTargets,
    "",
    "## 出力形式（厳密なJSON、説明文やコードブロック記法は付けないこと）",
    JSON.stringify(
      { items: Object.fromEntries(HP_AI_JUDGED_ITEMS.map((d, i) => [d.itemKey, i % 2 === 0])) },
      null,
      2
    ),
    "",
    "itemsは上記の項目すべてについて、JSONのbooleanであるtrueまたはfalseいずれかを必ず返してください（省略しないこと。" +
      "出力例のitemsの値はJSON形式を示すためのダミーであり、実際の判定結果ではありません。クオートの付かないJSONのboolean値で返すこと）。",
  ].join("\n");
}
