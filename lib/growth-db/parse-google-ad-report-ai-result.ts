// Google広告レポートのAI生成文章を3パートに分割する。
// build-google-ad-report-prompt.ts でAIに指示している見出しマーカーに対応。
// - マーカーより前: 1ページ目冒頭の運用状況サマリー（1〜2文）
// - "## サロン様へのご提案": サロン側にやってほしいこと
// - "## ココデザインが行う改善策": こちら側で行う改善策

export interface GoogleAdReportAiResultParts {
  summary: string;
  ownerSuggestion: string;
  agencyAction: string;
}

const OWNER_SUGGESTION_MARKER = "## サロン様へのご提案";
const AGENCY_ACTION_MARKER = "## ココデザインが行う改善策";

export function parseGoogleAdReportAiResult(aiResult: string): GoogleAdReportAiResultParts {
  const ownerIdx = aiResult.indexOf(OWNER_SUGGESTION_MARKER);
  const agencyIdx = aiResult.indexOf(AGENCY_ACTION_MARKER);

  const summary = aiResult.slice(0, ownerIdx === -1 ? aiResult.length : ownerIdx).trim();

  let ownerSuggestion = "";
  let agencyAction = "";
  if (ownerIdx !== -1) {
    const ownerEnd = agencyIdx !== -1 ? agencyIdx : aiResult.length;
    ownerSuggestion = aiResult.slice(ownerIdx + OWNER_SUGGESTION_MARKER.length, ownerEnd).trim();
  }
  if (agencyIdx !== -1) {
    agencyAction = aiResult.slice(agencyIdx + AGENCY_ACTION_MARKER.length).trim();
  }

  return { summary, ownerSuggestion, agencyAction };
}
