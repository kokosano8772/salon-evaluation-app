// Google広告レポートのAI生成文章を4パートに分割する。
// build-google-ad-report-prompt.ts でAIに指示している見出しマーカーに対応。
// - "## 運用状況": 1ページ目冒頭の運用状況サマリー（1〜2文）。マーカーより前のテキストは、
//   AIがurl_contextでの確認作業の説明などを書いてしまった場合のノイズとして無視する
//   （url_context有効時、まれにAIが「サイトを確認しました」等の前置きを本文の前に出力することがあり、
//   このマーカーが無いと前置きがそのまま要約として表示されてしまう不具合があったため）。
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

const SUMMARY_MARKER = "## 運用状況";
const AGE_GROUP_INSIGHT_MARKER = "## 年代別の傾向";
const OWNER_SUGGESTION_MARKER = "## サロン様へのご提案";
const AGENCY_ACTION_MARKER = "## ココデザインが行う改善策";

// このレポートはAIの生文字列をそのまま表示する（Markdownレンダラーを通さない）ため、
// AIが強調のつもりで付けがちな「**太字**」のようなMarkdown記法をプレーンテキスト化する。
function stripMarkdownEmphasis(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1");
}

// マーカーの「直後」が行末（またはテキスト末尾）である場合だけを本物の構成マーカーとして
// 検出する。url_context有効時、AIが確認作業の説明の中でプロンプトの指示文をそのまま引用し、
// 文中に "## 運用状況" のような文字列が混ざることがある（例:「"## 運用状況" の見出しで
// 書き始めること: Yes」）。単純なindexOf/文字列一致だとこの引用箇所を本物のマーカーと
// 誤認識してしまうため、マーカーの直後に他の文字が無いことを条件にする。
// 直前側は改行を要求しない（AIが検討過程の最後の文の末尾に改行を入れ忘れ、そのまま
// マーカーを続けて書いてしまうことがあり、改行必須にすると本物のマーカーまで
// 見逃してしまう不具合が実際に発生したため）。
// 該当箇所が複数見つかった場合は、AIの下書き・検討過程より後に来る可能性が高い
// 最後の一致を採用する。
function findMarkerLine(text: string, marker: string): { start: number; end: number } | null {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${escaped}[ \\t]*(?:\\n|$)`, "g");
  let match: RegExpExecArray | null;
  let last: { start: number; end: number } | null = null;
  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    last = { start, end: start + marker.length };
    if (re.lastIndex === match.index) re.lastIndex++;
  }
  return last;
}

// 実物PDFでは提案2パートとも「1行目に太字見出し・本文・末尾に一言アクションピル2つ（-区切り）」
// という構成のため、新しいマーカーを増やさず、セクション内の行構造だけで分ける。
function splitHeadlineAndBody(section: string): GoogleAdReportSuggestionPart {
  const trimmed = stripMarkdownEmphasis(section.trim());
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
  const summaryMarker = findMarkerLine(aiResult, SUMMARY_MARKER);
  const ageGroupMarker = findMarkerLine(aiResult, AGE_GROUP_INSIGHT_MARKER);
  const ownerMarker = findMarkerLine(aiResult, OWNER_SUGGESTION_MARKER);
  const agencyMarker = findMarkerLine(aiResult, AGENCY_ACTION_MARKER);

  const summaryEnd = ageGroupMarker?.start ?? ownerMarker?.start ?? aiResult.length;
  // "## 運用状況"マーカーがあれば、それより前のテキスト（AIが稀に書いてしまう確認作業の
  // 説明などの前置き）は破棄する。マーカーが無い場合のみ、後方互換として先頭からを使う。
  const summary = summaryMarker
    ? stripMarkdownEmphasis(aiResult.slice(summaryMarker.end, summaryEnd).trim())
    : stripMarkdownEmphasis(aiResult.slice(0, summaryEnd).trim());

  let ageGroupInsight = "";
  let ownerSuggestion: GoogleAdReportSuggestionPart = { headline: "", body: "", pills: [] };
  let agencyAction: GoogleAdReportSuggestionPart = { headline: "", body: "", pills: [] };
  if (ageGroupMarker) {
    const ageGroupEnd = ownerMarker?.start ?? agencyMarker?.start ?? aiResult.length;
    ageGroupInsight = stripMarkdownEmphasis(aiResult.slice(ageGroupMarker.end, ageGroupEnd).trim());
  }
  if (ownerMarker) {
    const ownerEnd = agencyMarker?.start ?? aiResult.length;
    ownerSuggestion = splitHeadlineAndBody(aiResult.slice(ownerMarker.end, ownerEnd));
  }
  if (agencyMarker) {
    agencyAction = splitHeadlineAndBody(aiResult.slice(agencyMarker.end));
  }

  return { summary, ageGroupInsight, ownerSuggestion, agencyAction };
}
