import { ReactNode } from "react";
import { Calendar, Eye, MousePointerClick, Percent, ThumbsUp } from "lucide-react";
import { AdReport, GOOGLE_REPORT_THEME } from "@/lib/growth-db/ad-report-types";
import { getBusinessCategoryBenchmark, AD_REPORT_TARGET_RATE } from "@/lib/growth-db/business-category-benchmarks";
import { YoyTrend } from "@/lib/growth-db/ad-report-trend";
import { parseGoogleAdReportAiResult } from "@/lib/growth-db/parse-google-ad-report-ai-result";
import { formatAdaptiveNumber, formatMonthLabel, formatMonthShortLabel, formatNumber } from "@/lib/growth-db/format";
import GoogleReportStatCard from "./GoogleReportStatCard";
import GoogleAgeRateChart from "./GoogleAgeRateChart";
import GoogleRateTrendChart from "./GoogleRateTrendChart";
import GoogleClicksTrendChart from "./GoogleClicksTrendChart";

interface GoogleAdReportDocumentProps {
  storeName: string;
  businessCategory: string;
  report: AdReport;
  trend: YoyTrend;
}

// 実際のコンバージョンアクション名は「店舗名（用途／チャネル）」のように長くなりがちなため、
// 「／」区切りの最後の要素（チャネル名など）だけを抜き出して表示を簡潔にする。
// パターンに合わない名前はそのまま表示する（店舗ごとに命名が違う可能性があるため）。
function simplifyConversionActionName(name: string): string {
  const match = name.match(/／\s*([^）／]+)\s*）?\s*$/);
  return match ? match[1].trim() : name;
}

function SectionCard({ children, pb }: { children: ReactNode; pb?: number }) {
  return (
    <div className="bg-white rounded-2xl p-4" style={pb !== undefined ? { paddingBottom: pb } : undefined}>
      {children}
    </div>
  );
}

function SectionTitle({ accent, caption, children }: { accent: string; caption?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-5 rounded-full" style={{ backgroundColor: accent }} />
        <p className="text-xl font-bold text-charcoal-900">{children}</p>
      </div>
      {caption && <p className="text-xs text-gray-400">{caption}</p>}
    </div>
  );
}

const RECRUITMENT_CONFIRM_OPTIONS = ["応募・面接につながった", "問い合わせのみあった", "特に反応はなかった"];
const ACQUISITION_CONFIRM_OPTIONS = ["忙しかった", "ほどほどだった", "暇だった"];

export default function GoogleAdReportDocument({ storeName, businessCategory, report, trend }: GoogleAdReportDocumentProps) {
  const isRecruitment = report.category === "recruitment";
  const theme = GOOGLE_REPORT_THEME[report.category];
  const benchmark = getBusinessCategoryBenchmark(businessCategory);
  const buttonLabel = isRecruitment ? "お問い合わせボタン" : "ご予約ボタン";
  const breakdown = report.conversionActionBreakdown ?? [];
  const { summary, ownerSuggestion, agencyAction } = parseGoogleAdReportAiResult(report.aiResult ?? "");
  const confirmOptions = isRecruitment ? RECRUITMENT_CONFIRM_OPTIONS : ACQUISITION_CONFIRM_OPTIONS;

  return (
    <div className="space-y-8">
      {/* ページ1 */}
      <div
        className="ad-report-page rounded-3xl p-8 w-[900px] max-w-none mx-auto"
        style={{ background: theme.bg }}
      >
        <h1 className="text-[42px] font-extrabold text-center text-charcoal-900">Google広告成果報告レポート</h1>
        <p className="text-center text-lg text-charcoal-700 mt-2">
          {storeName}様{isRecruitment ? "（求人）" : ""} | {formatMonthLabel(report.yearMonth)}分
        </p>

        <div className="mt-4">
          <SectionCard>
            <div className="flex items-center gap-6 py-4">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: theme.accent, color: "white" }}
              >
                <ThumbsUp size={42} strokeWidth={2} />
              </div>
              <div>
                <p className="text-3xl font-extrabold" style={{ color: theme.text }}>
                  {formatMonthShortLabel(report.yearMonth)}の運用状況：◎好調
                </p>
                <p className="text-lg text-charcoal-700 mt-2 leading-relaxed whitespace-pre-wrap">
                  {summary || "AI分析はまだ生成されていません"}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-[0.85fr_0.85fr_1.15fr_1.15fr] gap-4 mt-4">
          <GoogleReportStatCard
            icon={<Eye size={24} strokeWidth={2} />}
            title="表示回数"
            value={formatNumber(report.impressions)}
            unit="回"
            description="Google上で広告が見られた回数"
            accent={theme.accent}
            valueColor={theme.accent}
          />
          <GoogleReportStatCard
            icon={<MousePointerClick size={24} strokeWidth={2} />}
            title="クリック数"
            value={formatNumber(report.clicks)}
            unit="回"
            description="ホームページへ移動した回数"
            accent={theme.accent}
            valueColor={theme.accent}
          />
          <GoogleReportStatCard
            icon={<Calendar size={24} strokeWidth={2} />}
            title={`${buttonLabel}\nクリック数`}
            value={formatAdaptiveNumber(report.conversions)}
            unit="回"
            accent={theme.accent}
            valueColor={theme.accent}
          >
            {breakdown.length > 0 && (
              <div className="text-xs text-gray-500 leading-relaxed">
                <p className="font-semibold text-gray-600">内訳：</p>
                <p>
                  {breakdown
                    .map((b) => `${simplifyConversionActionName(b.name)} ${formatAdaptiveNumber(b.conversions)}回`)
                    .join("／")}
                </p>
              </div>
            )}
          </GoogleReportStatCard>
          <GoogleReportStatCard
            icon={<Percent size={24} strokeWidth={2} />}
            title={`${buttonLabel}を\n押した割合`}
            value={report.cvr.toFixed(2)}
            unit="%"
            accent={theme.accent}
            valueColor={theme.accent}
          >
            <div className="text-xs text-gray-400 leading-relaxed">
              {benchmark && <p>自社平均{benchmark.ownAverage}%</p>}
              <p>ココデザインでの目標: {AD_REPORT_TARGET_RATE}%</p>
              {benchmark?.nationalAverage !== undefined && <p>全国平均約{benchmark.nationalAverage}%</p>}
            </div>
          </GoogleReportStatCard>
        </div>

        <div className="mt-4">
          <SectionCard>
            <SectionTitle accent={theme.accent} caption={`() = ${buttonLabel}クリック数`}>
              【年代別】{buttonLabel}を押した割合
            </SectionTitle>
            <GoogleAgeRateChart
              clicks={report.ageGroupClicks ?? []}
              conversions={report.ageGroupConversions ?? []}
              accent={theme.chartAccent}
              showCrown={!isRecruitment}
            />
          </SectionCard>
        </div>

        <div className="mt-4">
          <SectionCard pb={8}>
            <SectionTitle accent={theme.accent}>{buttonLabel}を押した割合の推移</SectionTitle>
            <GoogleRateTrendChart
              previousCycle={trend.previousCycle}
              currentCycle={trend.currentCycle}
              previousLabel={trend.previousCycleLabel}
              currentLabel={trend.currentCycleLabel}
              target={isRecruitment ? undefined : AD_REPORT_TARGET_RATE}
              previousColor={theme.chartAccent}
              currentColor={theme.highlightAccent}
            />
          </SectionCard>
        </div>

        {isRecruitment && (
          <div className="mt-4">
            <SectionCard pb={8}>
              <SectionTitle accent={theme.accent}>クリック数の推移</SectionTitle>
              <GoogleClicksTrendChart
                previousCycle={trend.previousCycle}
                currentCycle={trend.currentCycle}
                previousLabel={trend.previousCycleLabel}
                currentLabel={trend.currentCycleLabel}
                previousColor={theme.chartAccent}
                currentColor={theme.highlightAccent}
              />
            </SectionCard>
          </div>
        )}

        {!isRecruitment && report.searchTerms && report.searchTerms.length > 0 && (
          <div className="mt-4">
            <SectionCard>
              <SectionTitle accent={theme.accent}>クリックが多かった検索語句</SectionTitle>
              <p className="text-sm text-gray-400 mb-3">広告からホームページに来るきっかけになった検索語句（サロン名での検索は除外）</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {report.searchTerms.slice(0, 3).map((s, i) => (
                  <div key={s.term} className="flex items-center gap-2 rounded-xl border px-4 py-3" style={{ borderColor: theme.accentSoft }}>
                    <span className="text-lg">{["🥇", "🥈", "🥉"][i]}</span>
                    <span className="text-sm font-semibold text-charcoal-800">{s.term}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-8">KOKODESIGN</p>
      </div>

      {/* ページ2 */}
      <div
        className="ad-report-page rounded-3xl p-8 w-[900px] max-w-none mx-auto space-y-6"
        style={{ background: theme.bg }}
      >
        <SectionCard>
          <SectionTitle accent={theme.accent}>サロン様へのご提案</SectionTitle>
          <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-wrap">
            {ownerSuggestion || "AI分析はまだ生成されていません"}
          </p>
        </SectionCard>

        <SectionCard>
          <SectionTitle accent={theme.accent}>ココデザインが行う改善策</SectionTitle>
          <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-wrap">
            {agencyAction || "AI分析はまだ生成されていません"}
          </p>
        </SectionCard>

        <SectionCard>
          <SectionTitle accent={theme.accent}>ご確認・ご返信のお願い</SectionTitle>
          <p className="text-sm text-charcoal-700 leading-relaxed">
            {isRecruitment
              ? "LINE・Instagram・電話などから、求人に関するお問い合わせや応募がございましたら、ご共有いただけますと幸いです。"
              : "電話やHPB・WEBでのご予約、ライン友達の増加など、アクションの変化などございましたら、お伝えいただけますと幸いです。"}
          </p>
          <p className="text-sm font-semibold mt-4 mb-2" style={{ color: theme.text }}>
            {isRecruitment ? "求人に関する反応はいかがでしたでしょうか？" : "実際にサロン様では前月と比べていかがでしたでしょうか？"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {confirmOptions.map((opt, i) => (
              <div
                key={opt}
                className="flex-1 flex items-center gap-2 rounded-xl border px-4 py-3"
                style={{ borderColor: theme.accentSoft }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                  style={{ backgroundColor: theme.accent }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-charcoal-800">{opt}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <p className="text-center text-xs text-gray-400">KOKODESIGN</p>
      </div>
    </div>
  );
}
