// AIが生成した「運用状況とご提案」文章を、状況分析パートと提案パートに分割する。
// build-ad-report-prompt.ts でAIに指示している "## 提案" 区切りに対応。

export interface AdReportAiResultParts {
  analysis: string;
  suggestion: string;
}

const SUGGESTION_MARKER = "## 提案";

export function parseAdReportAiResult(aiResult: string): AdReportAiResultParts {
  const idx = aiResult.indexOf(SUGGESTION_MARKER);
  if (idx === -1) return { analysis: aiResult.trim(), suggestion: "" };
  return {
    analysis: aiResult.slice(0, idx).trim(),
    suggestion: aiResult.slice(idx + SUGGESTION_MARKER.length).trim(),
  };
}
