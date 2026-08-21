// Google広告レポートのAI生成文章を4パートに分割する。
// build-google-ad-report-prompt.ts でAIに指示している見出しマーカーに対応。
// - マーカーより前: 1ページ目冒頭の運用状況サマリー（1〜2文）
// - "## 年代別の傾向": 【年代別】グラフ横に載せる一言（実物PDFの青文字部分）
// - "## サロン様へのご提案": サロン側にやってほしいこと
//   （1行目=太字見出し、本文、末尾に "- " で始まる行が2つ=アクションの一言ピル2つ）
// - "## ココデザインが行う改善策": こちら側で行う改善策（同上の構成）

export interface GoogleAdReportSuggestionPart {
  headline: string;
  body: string;
  pills: string[]; // 実物PDFにある「◯◯の確認」のような一言アクションピル（最大2つ）
}

export interface GoogleAdReportAiResultParts {
  summary: string;
  ageGroupInsight: string;
  ownerSuggestion: GoogleAdReportSuggestionPart;
  agencyAction: GoogleAdReportSuggestionPart;
}

const AGE_GROUP_INSIGHT_MARKER = "## 年代別の傾向";
const OWNER_SUGGESTION_MARKER = "## サロン様へのご提案";
const AGENCY_ACTION_MARKER = "## ココデザインが行う改善策";

// 実物PDFでは提案2パートとも「1行目に太字見出し・本文・末尾に一言アクションピル2つ（-区切り）」
// という構成のため、新しいマーカーを増やさず、セクション内の行構造だけで分ける。
function splitHeadlineAndBody(section: string): GoogleAdReportSuggestionPart {
  const trimmed = section.trim();
  const newlineIdx = trimmed.indexOf("\n");
  if (newlineIdx === -1) return { headline: trimmed, body: "", pills: [] };

  const headline = trimmed.slice(0, newlineIdx).trim();
  const rest = trimmed.slice(newlineIdx + 1).trim();

  const lines = rest.split("\n").map((l) => l.trim());
  const pills: string[] = [];
  const bodyLines: string[] = [];
  for (const line of lines) {
    if (/^[-・]\s*/.test(line) && pills.length < 2) {
      pills.push(line.replace(/^[-・]\s*/, "").trim());
    } else if (line) {
      bodyLines.push(line);
    }
  }

  return { headline, body: bodyLines.join("\n").trim(), pills };
}

export function parseGoogleAdReportAiResult(aiResult: string): GoogleAdReportAiResultParts {
  const ageGroupIdx = aiResult.indexOf(AGE_GROUP_INSIGHT_MARKER);
  const ownerIdx = aiResult.indexOf(OWNER_SUGGESTION_MARKER);
  const agencyIdx = aiResult.indexOf(AGENCY_ACTION_MARKER);

  const summaryEnd = ageGroupIdx !== -1 ? ageGroupIdx : ownerIdx !== -1 ? ownerIdx : aiResult.length;
  const summary = aiResult.slice(0, summaryEnd).trim();

  let ageGroupInsight = "";
  let ownerSuggestion: GoogleAdReportSuggestionPart = { headline: "", body: "", pills: [] };
  let agencyAction: GoogleAdReportSuggestionPart = { headline: "", body: "", pills: [] };
  if (ageGroupIdx !== -1) {
    const ageGroupEnd = ownerIdx !== -1 ? ownerIdx : agencyIdx !== -1 ? agencyIdx : aiResult.length;
    ageGroupInsight = aiResult.slice(ageGroupIdx + AGE_GROUP_INSIGHT_MARKER.length, ageGroupEnd).trim();
  }
  if (ownerIdx !== -1) {
    const ownerEnd = agencyIdx !== -1 ? agencyIdx : aiResult.length;
    ownerSuggestion = splitHeadlineAndBody(aiResult.slice(ownerIdx + OWNER_SUGGESTION_MARKER.length, ownerEnd));
  }
  if (agencyIdx !== -1) {
    agencyAction = splitHeadlineAndBody(aiResult.slice(agencyIdx + AGENCY_ACTION_MARKER.length));
  }

  return { summary, ageGroupInsight, ownerSuggestion, agencyAction };
}
