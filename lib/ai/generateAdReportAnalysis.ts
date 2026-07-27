// 広告レポートの「運用状況とご提案」文章をストリーミング生成する。
// lib/ai/gemini.ts の差し替え境界を generateCompetitorAnalysis.ts / generateGrowthSuggestions.ts
// と共用し、Gemini呼び出しを重複実装しない。

import { getGeminiModel } from "./gemini";
import { buildAdReportAnalysisPrompt } from "@/lib/growth-db/build-ad-report-prompt";
import { AdReport } from "@/lib/growth-db/ad-report-types";
import { AdReportComparison, CampaignAnalysis, GrowthLinkComparison } from "@/lib/growth-db/ad-report-analysis";

const SYSTEM_INSTRUCTION =
  "あなたは美容室の広告運用を担当する専門コンサルタントです。" +
  "与えられた数値は既に確定・計算済みのものなので、自分で計算し直したり数値を変えたりしないでください。" +
  "その数値の意味を解釈し、オーナーに伝わる自然な日本語の文章にすることだけがあなたの役割です。";

export async function streamAdReportAnalysis(
  report: AdReport,
  comparison: AdReportComparison,
  campaignAnalysis: CampaignAnalysis,
  growthComparison: GrowthLinkComparison
) {
  const model = getGeminiModel({ plainText: true, systemInstruction: SYSTEM_INSTRUCTION });
  const prompt = buildAdReportAnalysisPrompt(report, comparison, campaignAnalysis, growthComparison);
  return model.generateContentStream(prompt);
}
