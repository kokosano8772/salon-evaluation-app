"use client";

import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { AdReport } from "@/lib/growth-db/ad-report-types";
import {
  MetricComparison,
  analyzeCampaigns,
  compareAdReports,
  compareGrowthMetrics,
  findPreviousAdReport,
} from "@/lib/growth-db/ad-report-analysis";
import { MonthlyMetrics } from "@/lib/growth-db/types";
import { formatMonthLabel, formatNumber, formatPercent, formatYen } from "@/lib/growth-db/format";

const GOOD_COLOR = "#6BAB8A";
const BAD_COLOR = "#E08B6B";
const NEUTRAL_COLOR = "#9CA3AF";

type MetricFormat = "yen" | "number" | "percent";

interface MetricConfig {
  key: keyof ReturnType<typeof compareAdReports>;
  label: string;
  format: MetricFormat;
  lowerIsBetter?: boolean;
}

const AD_METRICS: MetricConfig[] = [
  { key: "spend", label: "広告費", format: "yen" },
  { key: "clicks", label: "クリック数", format: "number" },
  { key: "ctr", label: "CTR", format: "percent" },
  { key: "cpc", label: "CPC", format: "yen", lowerIsBetter: true },
  { key: "conversions", label: "コンバージョン数", format: "number" },
  { key: "cpa", label: "CPA", format: "yen", lowerIsBetter: true },
];

function formatValue(value: number, format: MetricFormat): string {
  if (format === "yen") return formatYen(value);
  if (format === "percent") return formatPercent(value);
  return formatNumber(value);
}

function changeColor(comparison: MetricComparison, lowerIsBetter: boolean): string {
  if (comparison.changePercent === null) return NEUTRAL_COLOR;
  const improved = lowerIsBetter ? comparison.changePercent < 0 : comparison.changePercent > 0;
  if (comparison.changePercent === 0) return NEUTRAL_COLOR;
  return improved ? GOOD_COLOR : BAD_COLOR;
}

function MetricCard({ config, comparison }: { config: MetricConfig; comparison: MetricComparison }) {
  const color = changeColor(comparison, !!config.lowerIsBetter);
  return (
    <div className="rounded-2xl border border-gray-100 p-4">
      <p className="text-xs text-gray-400 mb-1.5">{config.label}</p>
      <p className="text-lg font-bold text-charcoal-900">{formatValue(comparison.current, config.format)}</p>
      {comparison.changePercent === null ? (
        <p className="text-xs text-gray-400 mt-1">前月データなし</p>
      ) : (
        <p className="text-xs font-medium mt-1 flex items-center gap-1" style={{ color }}>
          {comparison.changePercent > 0 ? <TrendingUp size={12} /> : comparison.changePercent < 0 ? <TrendingDown size={12} /> : null}
          前月比 {comparison.changePercent > 0 ? "+" : ""}
          {comparison.changePercent}%
        </p>
      )}
    </div>
  );
}

const GROWTH_METRICS: { key: keyof ReturnType<typeof compareGrowthMetrics>; label: string; format: MetricFormat }[] = [
  { key: "totalRevenue", label: "月間売上", format: "yen" },
  { key: "newCustomers", label: "新規客数", format: "number" },
  { key: "existingCustomers", label: "既存客数", format: "number" },
  { key: "totalVisits", label: "総来店数", format: "number" },
  { key: "averageUnitPrice", label: "客単価", format: "yen" },
];

interface AdReportAnalysisSummaryProps {
  report: AdReport;
  history: AdReport[];
  monthlyHistory: MonthlyMetrics[];
}

export default function AdReportAnalysisSummary({ report, history, monthlyHistory }: AdReportAnalysisSummaryProps) {
  const previousReport = findPreviousAdReport(history, report);
  const comparison = compareAdReports(report, previousReport);
  const campaignAnalysis = analyzeCampaigns(report.campaigns, previousReport?.campaigns ?? []);
  const growthComparison = compareGrowthMetrics(monthlyHistory, report.yearMonth);

  return (
    <div className="space-y-6 mb-6">
      <div className="card-luxury p-6">
        <p className="text-xs font-medium text-gray-400 tracking-wide mb-4">
          前月比較{previousReport ? `（${formatMonthLabel(previousReport.yearMonth)}との比較）` : ""}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {AD_METRICS.map((config) => (
            <MetricCard key={config.key} config={config} comparison={comparison[config.key]} />
          ))}
        </div>
      </div>

      {report.campaigns.length > 0 && (
        <div className="card-luxury p-6">
          <p className="text-xs font-medium text-gray-400 tracking-wide mb-4">キャンペーン分析</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaignAnalysis.best && (
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-xs text-[#6BAB8A] font-semibold mb-1.5 flex items-center gap-1">
                  <TrendingUp size={12} />
                  最も成果が良いキャンペーン
                </p>
                <p className="text-sm font-bold text-charcoal-900">{campaignAnalysis.best.name || "（名称未入力）"}</p>
                <p className="text-xs text-gray-400 mt-1">CPA {formatYen(campaignAnalysis.best.cpa)}</p>
              </div>
            )}
            {campaignAnalysis.worst && (
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-xs text-[#E08B6B] font-semibold mb-1.5 flex items-center gap-1">
                  <TrendingDown size={12} />
                  改善が必要なキャンペーン
                </p>
                <p className="text-sm font-bold text-charcoal-900">{campaignAnalysis.worst.name || "（名称未入力）"}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {campaignAnalysis.worst.conversions === 0
                    ? `コンバージョン0件（広告費 ${formatYen(campaignAnalysis.worst.spend)}）`
                    : `CPA ${formatYen(campaignAnalysis.worst.cpa)}`}
                </p>
              </div>
            )}
          </div>

          {campaignAnalysis.highSpendLowPerformance.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <AlertTriangle size={12} />
                広告費を使っているが成果が弱いキャンペーン
              </p>
              <div className="space-y-1.5">
                {campaignAnalysis.highSpendLowPerformance.map((c) => (
                  <p key={c.id} className="text-sm text-gray-600">
                    {c.name || "（名称未入力）"}（広告費 {formatYen(c.spend)}・CVR {formatPercent(c.cvr)}）
                  </p>
                ))}
              </div>
            </div>
          )}

          {campaignAnalysis.worsened.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <TrendingDown size={12} />
                前月よりCPAが悪化したキャンペーン
              </p>
              <div className="space-y-1.5">
                {campaignAnalysis.worsened.map(({ campaign, cpaChangePercent }) => (
                  <p key={campaign.id} className="text-sm text-gray-600">
                    {campaign.name || "（名称未入力）"}（CPA {formatYen(campaign.cpa)}・前月比 +{cpaChangePercent}%）
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card-luxury p-6">
        <p className="text-xs font-medium text-gray-400 tracking-wide mb-4">成長データとの関連</p>
        {growthComparison.totalRevenue === null ? (
          <p className="text-sm text-gray-400">この月の月次データ（売上・集客）がまだ入力されていません。</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {GROWTH_METRICS.map((config) => {
              const value = growthComparison[config.key];
              if (!value) return null;
              return <MetricCard key={config.key} config={{ key: config.key as never, label: config.label, format: config.format }} comparison={value} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
