// Google広告レポートの「運用状況・年代別の傾向・ご提案・改善策」文章をストリーミング生成する。
// Meta用のgenerateAdReportAnalysis.tsには一切手を加えず、Google専用として完全に分離する。
// lib/ai/gemini.ts の差し替え境界は共用する。

import { getGeminiModel } from "./gemini";
import { buildGoogleAdReportAnalysisPrompt } from "@/lib/growth-db/build-google-ad-report-prompt";
import { AdReport } from "@/lib/growth-db/ad-report-types";
import { AdReportComparison, GrowthLinkComparison } from "@/lib/growth-db/ad-report-analysis";
import { YoyTrend } from "@/lib/growth-db/ad-report-trend";

const SYSTEM_INSTRUCTION =
  "あなたは美容室の広告運用を担当する専門コンサルタントです。" +
  "与えられた数値は既に確定・計算済みのものなので、自分で計算し直したり数値を変えたりしないでください。" +
  "その数値の意味を解釈し、オーナーに伝わる自然な日本語の文章にすることだけがあなたの役割です。";

export async function streamGoogleAdReportAnalysis(
  report: AdReport,
  comparison: AdReportComparison,
  growthComparison: GrowthLinkComparison,
  trend: YoyTrend
) {
  const model = getGeminiModel({ plainText: true, systemInstruction: SYSTEM_INSTRUCTION });
  const prompt = buildGoogleAdReportAnalysisPrompt(report, comparison, growthComparison, trend);
  return model.generateContentStream(prompt);
}
