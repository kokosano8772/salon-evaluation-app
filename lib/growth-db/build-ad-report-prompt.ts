// 広告レポートのAI分析用プロンプトを組み立てる。
// ここで渡す数値はすべて lib/growth-db/ad-report-analysis.ts で計算済みのもの。
// AIには一切計算させず、渡された数値をそのまま解釈・文章化させるだけに留める
// （「AIにすべての計算を任せない」という要件のための境界）。

import { AdReport, AGE_GROUPS } from "./ad-report-types";
import { AdReportComparison, CampaignAnalysis, GrowthLinkComparison, MetricComparison } from "./ad-report-analysis";
import { formatMonthLabel, formatPercent, formatYen, formatNumber } from "./format";

function formatChange(comparison: MetricComparison, format: "yen" | "number" | "percent"): string {
  const value = format === "yen" ? formatYen(comparison.current) : format === "percent" ? formatPercent(comparison.current) : formatNumber(comparison.current);
  if (comparison.changePercent === null) return `${value}（前月データなし）`;
  const sign = comparison.changePercent > 0 ? "+" : "";
  return `${value}（前月比 ${sign}${comparison.changePercent}%）`;
}

export function buildAdReportAnalysisPrompt(
  report: AdReport,
  comparison: AdReportComparison,
  campaignAnalysis: CampaignAnalysis,
  growthComparison: GrowthLinkComparison
): string {
  const lines: string[] = [];

  lines.push(`# ${formatMonthLabel(report.yearMonth)}の広告実績データ（すべて計算済みの確定値）`);
  lines.push("");
  lines.push("## ①前月比較");
  lines.push(`- 広告費: ${formatChange(comparison.spend, "yen")}`);
  lines.push(`- クリック数: ${formatChange(comparison.clicks, "number")}`);
  lines.push(`- CTR: ${formatChange(comparison.ctr, "percent")}`);
  lines.push(`- CPC: ${formatChange(comparison.cpc, "yen")}`);
  lines.push(`- コンバージョン数: ${formatChange(comparison.conversions, "number")}`);
  lines.push(`- CPA: ${formatChange(comparison.cpa, "yen")}`);

  if (report.ageGroupClicks && report.ageGroupClicks.length > 0) {
    const best = [...report.ageGroupClicks].sort((a, b) => b.clicks - a.clicks)[0];
    lines.push("");
    lines.push("## 年齢層別クリック数（今月）");
    for (const group of AGE_GROUPS) {
      const entry = report.ageGroupClicks.find((e) => e.ageGroup === group);
      if (entry) lines.push(`- ${group}歳: ${entry.clicks}回`);
    }
    lines.push(`- 最も反応が良い年齢層: ${best.ageGroup}歳`);
    if (report.targetAgeRange) lines.push(`- 設定ターゲット年齢: ${report.targetAgeRange}`);
  }

  if (report.campaigns.length > 0) {
    lines.push("");
    lines.push("## ②キャンペーン分析");
    if (campaignAnalysis.best) {
      lines.push(`- 最も成果が良いキャンペーン: 「${campaignAnalysis.best.name || "（名称未入力）"}」CPA ${formatYen(campaignAnalysis.best.cpa)}`);
    }
    if (campaignAnalysis.worst) {
      const detail =
        campaignAnalysis.worst.conversions === 0
          ? `コンバージョン0件（広告費 ${formatYen(campaignAnalysis.worst.spend)}）`
          : `CPA ${formatYen(campaignAnalysis.worst.cpa)}`;
      lines.push(`- 改善が必要なキャンペーン: 「${campaignAnalysis.worst.name || "（名称未入力）"}」${detail}`);
    }
    for (const c of campaignAnalysis.highSpendLowPerformance) {
      lines.push(`- 広告費を使っているが成果が弱い: 「${c.name || "（名称未入力）"}」広告費 ${formatYen(c.spend)}・CVR ${formatPercent(c.cvr)}`);
    }
    for (const { campaign, cpaChangePercent } of campaignAnalysis.worsened) {
      lines.push(`- 前月よりCPAが悪化: 「${campaign.name || "（名称未入力）"}」CPA ${formatYen(campaign.cpa)}・前月比 +${cpaChangePercent}%`);
    }
  }

  if (growthComparison.totalRevenue !== null) {
    lines.push("");
    lines.push("## ③成長データ（売上・集客）との関連");
    lines.push(`- 月間売上: ${formatChange(growthComparison.totalRevenue, "yen")}`);
    if (growthComparison.newCustomers) lines.push(`- 新規客数: ${formatChange(growthComparison.newCustomers, "number")}`);
    if (growthComparison.existingCustomers) lines.push(`- 既存客数: ${formatChange(growthComparison.existingCustomers, "number")}`);
    if (growthComparison.totalVisits) lines.push(`- 総来店数: ${formatChange(growthComparison.totalVisits, "number")}`);
    if (growthComparison.averageUnitPrice) lines.push(`- 客単価: ${formatChange(growthComparison.averageUnitPrice, "yen")}`);
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "上記はすべて計算済みの確定値です。あなたはこの数値を一切再計算せず、解釈と文章化だけを行ってください。" +
      "美容室オーナー向けの広告運用レポートの「運用状況とご提案」欄に載せる文章を、次の2部構成で日本語で書いてください。" +
      "数値の再掲は根拠として簡潔に触れる程度にとどめ、羅列や表形式にはしないでください。"
  );
  lines.push("");
  lines.push(
    "1部目（見出し不要）: 3〜5文程度の地の文で、前月比較・キャンペーン分析・成長データとの関連（データがあれば）を踏まえた状況分析を書く。" +
      "良かった点・気になる点の両方に触れる。"
  );
  lines.push("");
  lines.push(
    '2部目: 1行目に "## 提案" とだけ書いた見出しを置き、その後に2〜4文で具体的な改善提案を書く。' +
      "「継続すべきこと」「改善すべきこと」「中止すべきこと」「次に試すべきこと」のうち、データから妥当なものだけを選んで触れる。" +
      "抽象論ではなく、キャンペーン名や年齢層など具体的な固有名詞を使うこと。"
  );

  return lines.join("\n");
}
