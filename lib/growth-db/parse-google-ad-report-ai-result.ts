// Google広告レポートのAI生成文章を4パートに分割する。
// build-google-ad-report-prompt.ts でAIに指示している見出しマーカーに対応。
// - マーカーより前: 1ページ目冒頭の運用状況サマリー（1〜2文）
// - "## 年代別の傾向": 【年代別】グラフ横に載せる一言（実物PDFの青文字部分）
// - "## サロン様へのご提案": サロン側にやってほしいこと
// - "## ココデザインが行う改善策": こちら側で行う改善策

export interface GoogleAdReportAiResultParts {
  summary: string;
  ageGroupInsight: string;
  ownerSuggestion: string;
  agencyAction: string;
}

const AGE_GROUP_INSIGHT_MARKER = "## 年代別の傾向";
const OWNER_SUGGESTION_MARKER = "## サロン様へのご提案";
const AGENCY_ACTION_MARKER = "## ココデザインが行う改善策";

export function parseGoogleAdReportAiResult(aiResult: string): GoogleAdReportAiResultParts {
  const ageGroupIdx = aiResult.indexOf(AGE_GROUP_INSIGHT_MARKER);
  const ownerIdx = aiResult.indexOf(OWNER_SUGGESTION_MARKER);
  const agencyIdx = aiResult.indexOf(AGENCY_ACTION_MARKER);

  const summaryEnd = ageGroupIdx !== -1 ? ageGroupIdx : ownerIdx !== -1 ? ownerIdx : aiResult.length;
  const summary = aiResult.slice(0, summaryEnd).trim();

  let ageGroupInsight = "";
  let ownerSuggestion = "";
  let agencyAction = "";
  if (ageGroupIdx !== -1) {
    const ageGroupEnd = ownerIdx !== -1 ? ownerIdx : agencyIdx !== -1 ? agencyIdx : aiResult.length;
    ageGroupInsight = aiResult.slice(ageGroupIdx + AGE_GROUP_INSIGHT_MARKER.length, ageGroupEnd).trim();
  }
  if (ownerIdx !== -1) {
    const ownerEnd = agencyIdx !== -1 ? agencyIdx : aiResult.length;
    ownerSuggestion = aiResult.slice(ownerIdx + OWNER_SUGGESTION_MARKER.length, ownerEnd).trim();
  }
  if (agencyIdx !== -1) {
    agencyAction = aiResult.slice(agencyIdx + AGENCY_ACTION_MARKER.length).trim();
  }

  return { summary, ageGroupInsight, ownerSuggestion, agencyAction };
}
