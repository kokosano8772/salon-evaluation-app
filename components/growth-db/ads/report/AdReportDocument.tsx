import { ReactNode } from "react";
import { AD_REPORT_ACCENT_COLOR, AD_REPORT_SECTION_HEADER_BG, AdReport, GenderBreakdown } from "@/lib/growth-db/ad-report-types";
import { AgeGroupTrendPoint, CtrTrendPoint } from "@/lib/growth-db/ad-report-trend";
import { formatMonthLabel, formatNumber, formatPercent } from "@/lib/growth-db/format";
import ReportStatCard from "./ReportStatCard";
import GenderDonutChart from "./GenderDonutChart";
import CtrByGenderChart from "./CtrByGenderChart";
import HourlyClicksChart from "./HourlyClicksChart";
import AnnualCtrChart from "./AnnualCtrChart";
import AgeGroupTrendChart from "./AgeGroupTrendChart";

const EMPTY_GENDER_VALUE = { male: 0, female: 0, other: 0 };
const EMPTY_GENDER_BREAKDOWN: GenderBreakdown = {
  impressions: EMPTY_GENDER_VALUE,
  reach: EMPTY_GENDER_VALUE,
  clicks: EMPTY_GENDER_VALUE,
  ctr: EMPTY_GENDER_VALUE,
};

interface AdReportDocumentProps {
  storeName: string;
  report: AdReport;
  ctrTrend: CtrTrendPoint[];
  ageGroupTrend: AgeGroupTrendPoint[];
}

function SectionHeader({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div
        className="inline-block px-4 py-2 rounded-lg font-bold text-charcoal-900"
        style={{ background: AD_REPORT_SECTION_HEADER_BG }}
      >
        {children}
      </div>
      {extra}
    </div>
  );
}

function EmptyChartNote() {
  return <p className="text-sm text-gray-300 py-12 text-center">データ未入力</p>;
}

export default function AdReportDocument({ storeName, report, ctrTrend, ageGroupTrend }: AdReportDocumentProps) {
  const gender = report.genderBreakdown ?? EMPTY_GENDER_BREAKDOWN;
  const hourly = report.hourlyClicks ?? [];

  return (
    <div className="space-y-8">
      {/* ページ1（横幅900pxで固定。高さはコンテンツに任せ、無理な引き伸ばしはしない） */}
      <div className="ad-report-page rounded-3xl p-8 w-[900px] max-w-none mx-auto" style={{ background: "#F3F2EF" }}>
        <div>
          <p className="text-right text-xs font-bold tracking-widest text-gray-400 mb-3">KOKODESIGN</p>
          <h1 className="text-3xl font-extrabold text-center text-charcoal-900">Instagram広告成果報告レポート</h1>
          <p className="text-center text-base text-charcoal-700 mt-1.5">
            {storeName} 様 - {formatMonthLabel(report.yearMonth)}分-
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
          <ReportStatCard title="何回表示されたか" subtitle="（インプレッション数）" unit="回" value={formatNumber(report.impressions)}>
            <GenderDonutChart value={gender.impressions} />
          </ReportStatCard>
          <ReportStatCard title="何人が見たか" subtitle="（リーチ数）" unit="人" value={formatNumber(report.reach ?? 0)}>
            <GenderDonutChart value={gender.reach} />
          </ReportStatCard>
          <ReportStatCard title="クリックされた数" subtitle="（クリック数）" unit="回" value={formatNumber(report.clicks)}>
            <GenderDonutChart value={gender.clicks} />
          </ReportStatCard>
          <div className="bg-white rounded-2xl p-8 h-full">
            <p className="text-2xl font-bold text-charcoal-900 text-center">
              どれくらいの確率で
              <br />
              クリックされたか
            </p>
            <p className="text-base text-gray-400 mt-1 text-center">（クリックされた数 ÷ 表示された数 ＝ CTR）</p>
            <div className="text-center mt-8">
              <span className="text-6xl font-extrabold" style={{ color: AD_REPORT_ACCENT_COLOR }}>
                {formatPercent(report.ctr, 2)}
              </span>
            </div>
            {report.platform === "meta" && (
              <p className="text-sm font-semibold text-center mt-2" style={{ color: AD_REPORT_ACCENT_COLOR }}>
                他社の平均 0.3〜0.5%
              </p>
            )}
            <div className="mt-2">
              <CtrByGenderChart value={gender.ctr} />
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">KOKODESIGN</p>
      </div>

      {/* ページ2（同じく横幅900pxで固定、高さはコンテンツに任せる） */}
      <div className="ad-report-page rounded-3xl p-8 w-[900px] max-w-none mx-auto" style={{ background: "#F3F2EF" }}>
        <p className="text-xs font-bold tracking-widest text-gray-400 mb-4">KOKODESIGN</p>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6">
            <SectionHeader>時間帯別クリック数</SectionHeader>
            {hourly.length > 0 ? <HourlyClicksChart data={hourly} /> : <EmptyChartNote />}
          </div>

          <div className="bg-white rounded-2xl p-6">
            <SectionHeader>年間CTR</SectionHeader>
            {ctrTrend.length > 0 ? <AnnualCtrChart data={ctrTrend} /> : <EmptyChartNote />}
          </div>

          <div className="bg-white rounded-2xl p-6">
            <SectionHeader extra={<p className="text-xs text-gray-500">設定年齢 : {report.targetAgeRange || "未設定"}</p>}>
              年齢別クリック数
            </SectionHeader>
            {ageGroupTrend.length > 0 ? <AgeGroupTrendChart data={ageGroupTrend} /> : <EmptyChartNote />}
          </div>

          <div className="bg-white rounded-2xl p-6">
            <SectionHeader>運用状況とご提案</SectionHeader>
            {report.aiResult ? (
              <div className="flex gap-5 items-stretch">
                <div
                  className="shrink-0 w-28 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                  style={{ background: AD_REPORT_ACCENT_COLOR }}
                >
                  提案
                </div>
                <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-wrap flex-1">{report.aiResult}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-300 py-6 text-center">AI分析は準備中です（Phase 4で対応予定）</p>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-8">KOKODESIGN</p>
      </div>
    </div>
  );
}
