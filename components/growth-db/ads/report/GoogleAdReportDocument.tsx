"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Images,
  List,
  Loader2,
  MousePointerClick,
  Pencil,
  Percent,
  Settings,
  ThumbsUp,
  X,
} from "lucide-react";
import * as repo from "@/lib/growth-db/ad-report-repository";
import { AdReport, GOOGLE_REPORT_THEME } from "@/lib/growth-db/ad-report-types";
import { getBusinessCategoryBenchmark, AD_REPORT_TARGET_RATE, NATIONAL_AVERAGE_CVR } from "@/lib/growth-db/business-category-benchmarks";
import { YoyTrend } from "@/lib/growth-db/ad-report-trend";
import {
  buildGoogleAdReportAiResultString,
  DEFAULT_STATUS,
  GoogleAdReportPill,
  GoogleAdReportSuggestionPart,
  parseGoogleAdReportAiResult,
  PILL_ICON_KEYS,
  PillIconKey,
} from "@/lib/growth-db/parse-google-ad-report-ai-result";
import { formatAdaptiveNumber, formatMonthLabel, formatMonthShortLabel, formatNumber } from "@/lib/growth-db/format";
import GoogleReportStatCard from "./GoogleReportStatCard";
import GoogleAgeRateChart from "./GoogleAgeRateChart";
import GoogleRateTrendChart from "./GoogleRateTrendChart";
import GoogleClicksTrendChart from "./GoogleClicksTrendChart";

interface GoogleAdReportDocumentProps {
  storeId: string;
  storeName: string;
  businessCategory: string;
  report: AdReport;
  trend: YoyTrend;
  onSaved: (aiResult: string) => void;
  onEditingChange?: (isEditing: boolean) => void;
}

// 実際のコンバージョンアクション名は「店舗名（用途／チャネル）」のように長くなりがちなため、
// 「／」区切りの最後の要素（チャネル名など）だけを抜き出して表示を簡潔にする。
// パターンに合わない名前はそのまま表示する（店舗ごとに命名が違う可能性があるため）。
function simplifyConversionActionName(name: string): string {
  const match = name.match(/／\s*([^）／]+)\s*）?\s*$/);
  return match ? match[1].trim() : name;
}

// 「店舗名（グループ／チャネル）」形式のうち、括弧内の「グループ」部分（複数サロンを
// 運営している店舗では支店名が入る等）を取り出す。この形式に一致しない名前はnullを返す。
function parseConversionActionName(name: string): { group: string; channel: string } | null {
  const match = name.match(/（([^／）]+)／([^）]+)）\s*$/);
  if (!match) return null;
  return { group: match[1].trim(), channel: match[2].trim() };
}

const CONVERSION_GROUP_COLORS = ["#6B8CAE", "#C98A9E", "#8A9B6E", "#B08968", "#9B8AB8"];

interface ConversionGroup {
  name: string;
  items: { channel: string; conversions: number }[];
}

// 内訳を「グループ（支店名など）」でまとめられる場合はグループごとに分けて返す。
// グループが1種類しかない（複数サロンを分けていない）場合は、まとめる意味が無いため
// nullを返し、呼び出し側で従来通りのフラットな1行表示にフォールバックする。
function groupConversionBreakdown(breakdown: { name: string; conversions: number }[]): ConversionGroup[] | null {
  const parsed = breakdown.map((b) => ({ ...b, parsed: parseConversionActionName(b.name) }));
  if (parsed.some((b) => !b.parsed)) return null;

  const groups: ConversionGroup[] = [];
  for (const b of parsed) {
    const { group, channel } = b.parsed!;
    let g = groups.find((x) => x.name === group);
    if (!g) {
      g = { name: group, items: [] };
      groups.push(g);
    }
    g.items.push({ channel, conversions: b.conversions });
  }
  return groups.length > 1 ? groups : null;
}

function SectionCard({ children, pb, pt, px }: { children: ReactNode; pb?: number; pt?: number; px?: number }) {
  const override: { paddingBottom?: number; paddingTop?: number; paddingLeft?: number; paddingRight?: number } = {};
  if (pb !== undefined) override.paddingBottom = pb;
  if (pt !== undefined) override.paddingTop = pt;
  if (px !== undefined) {
    override.paddingLeft = px;
    override.paddingRight = px;
  }
  return (
    <div className="bg-white rounded-2xl p-3" style={Object.keys(override).length > 0 ? override : undefined}>
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

const PILL_ICON_COMPONENTS: Record<PillIconKey, typeof CheckCircle2> = {
  check: CheckCircle2,
  gear: Settings,
  clock: Clock,
  photo: Images,
  list: List,
};

// レポート内編集モードで、ピル1つ分の「アイコン選択(5種から選択式)＋文言入力」をまとめた入力欄。
// サロン様へのご提案・ココデザインが行う改善策、それぞれのピル最大2つ分で共通利用する。
function PillEditor({
  pill,
  accent,
  onChange,
}: {
  pill: GoogleAdReportPill;
  accent: string;
  onChange: (pill: GoogleAdReportPill) => void;
}) {
  return (
    <div className="flex-1 rounded-xl border-[3px] border-dashed border-gray-300 px-4 py-3">
      <div className="flex items-center gap-1 mb-2">
        {PILL_ICON_KEYS.map((key) => {
          const Icon = PILL_ICON_COMPONENTS[key];
          const selected = pill.icon === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...pill, icon: key })}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"
              style={selected ? { backgroundColor: accent, color: "white" } : undefined}
            >
              <Icon size={14} strokeWidth={2} />
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={pill.text}
        onChange={(e) => onChange({ ...pill, text: e.target.value })}
        placeholder="ピルの文言（任意）"
        className="w-full text-lg text-charcoal-800 bg-transparent focus:outline-none"
      />
    </div>
  );
}

const RECRUITMENT_CONFIRM_OPTIONS = ["応募・面接につながった", "問い合わせのみあった", "特に反応はなかった"];
const ACQUISITION_CONFIRM_OPTIONS = ["忙しかった", "ほどほどだった", "暇だった"];

const EMPTY_SUGGESTION: GoogleAdReportSuggestionPart = { headline: "", body: "", pills: [] };
const DEFAULT_PILL: GoogleAdReportPill = { icon: "check", text: "" };

export default function GoogleAdReportDocument({
  storeId,
  storeName,
  businessCategory,
  report,
  trend,
  onSaved,
  onEditingChange,
}: GoogleAdReportDocumentProps) {
  const isRecruitment = report.category === "recruitment";
  const theme = GOOGLE_REPORT_THEME[report.category];
  const benchmark = getBusinessCategoryBenchmark(businessCategory);
  const buttonLabel = isRecruitment ? "お問い合わせボタン" : "ご予約ボタン";
  const breakdown = report.conversionActionBreakdown ?? [];
  const conversionGroups = groupConversionBreakdown(breakdown);
  const { status, summary, ageGroupInsight, ownerSuggestion, agencyAction } = parseGoogleAdReportAiResult(report.aiResult ?? "");
  const confirmOptions = isRecruitment ? RECRUITMENT_CONFIRM_OPTIONS : ACQUISITION_CONFIRM_OPTIONS;

  // 前サイクル（比較対象となる1年前の実績）がまだ1件も無い＝開始から1周年を
  // 迎えていない店舗の場合、進行中サイクル1本だけが「新しい方の色」で表示され
  // 画面全体がその色一色になってしまい、他の月と比べて不自然に目立って見える。
  // この場合だけ、進行中サイクルの色を「前サイクル用の色」に差し替えて、
  // 1周年後に本当の前サイクルとして表示される時と同じ見た目に揃える。
  const hasPreviousCycleData = trend.previousCycle.some((p) => p.rate !== null || p.clicks !== null);
  const trendCurrentColor = hasPreviousCycleData ? theme.highlightAccent : theme.chartAccent;

  // レポート内の各ページ下にある「編集」ボタンから、その場でAI生成文章を修正できるようにする。
  // ページ1（summary/ageGroupInsight）とページ2（ownerSuggestion/agencyAction）を別々に
  // draft管理し、片方の保存操作がもう片方の未保存の入力内容を巻き込まないようにする。
  const [editingPage1, setEditingPage1] = useState(false);
  const [editingPage2, setEditingPage2] = useState(false);
  const [page1Draft, setPage1Draft] = useState({ status: "", summary: "", ageGroupInsight: "" });
  const [page2Draft, setPage2Draft] = useState<{ ownerSuggestion: GoogleAdReportSuggestionPart; agencyAction: GoogleAdReportSuggestionPart }>({
    ownerSuggestion: EMPTY_SUGGESTION,
    agencyAction: EMPTY_SUGGESTION,
  });
  const [savingPage1, setSavingPage1] = useState(false);
  const [savingPage2, setSavingPage2] = useState(false);

  useEffect(() => {
    onEditingChange?.(editingPage1 || editingPage2);
  }, [editingPage1, editingPage2, onEditingChange]);

  const startEditPage1 = () => {
    setPage1Draft({ status, summary, ageGroupInsight });
    setEditingPage1(true);
  };

  const savePage1 = async () => {
    setSavingPage1(true);
    const merged = { ...parseGoogleAdReportAiResult(report.aiResult ?? ""), ...page1Draft };
    const newAiResult = buildGoogleAdReportAiResultString(merged);
    await repo.upsertAdReport(storeId, report.yearMonth, "google", { aiResult: newAiResult }, report.category);
    setSavingPage1(false);
    setEditingPage1(false);
    onSaved(newAiResult);
  };

  const startEditPage2 = () => {
    setPage2Draft({ ownerSuggestion, agencyAction });
    setEditingPage2(true);
  };

  const savePage2 = async () => {
    setSavingPage2(true);
    const merged = { ...parseGoogleAdReportAiResult(report.aiResult ?? ""), ...page2Draft };
    const newAiResult = buildGoogleAdReportAiResultString(merged);
    await repo.upsertAdReport(storeId, report.yearMonth, "google", { aiResult: newAiResult }, report.category);
    setSavingPage2(false);
    setEditingPage2(false);
    onSaved(newAiResult);
  };

  return (
    <div className="space-y-8">
      {/* ページ1 */}
      <div
        className="ad-report-page rounded-3xl px-8 pt-8 pb-4 w-[900px] min-h-[1150px] max-w-none mx-auto flex flex-col justify-center"
        style={{ background: theme.bg }}
      >
        <h1 className="text-[42px] font-extrabold text-center text-charcoal-900">Google広告成果報告レポート</h1>
        <p className="text-center text-lg text-charcoal-700 mt-2">
          {storeName}様{isRecruitment ? "（求人）" : ""} | {formatMonthLabel(report.yearMonth)}分
        </p>

        <div className="mt-3">
          <SectionCard px={32}>
            <div className="flex items-center gap-6 py-4">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: theme.accent, color: "white" }}
              >
                <ThumbsUp size={42} strokeWidth={2} />
              </div>
              <div className="flex-1">
                {editingPage1 ? (
                  <div className="flex items-center gap-1.5 text-3xl font-extrabold" style={{ color: theme.text }}>
                    <span className="shrink-0">{formatMonthShortLabel(report.yearMonth)}の運用状況：</span>
                    <input
                      type="text"
                      value={page1Draft.status}
                      onChange={(e) => setPage1Draft((d) => ({ ...d, status: e.target.value }))}
                      placeholder={DEFAULT_STATUS}
                      className="text-3xl font-extrabold bg-transparent border border-dashed border-gray-300 rounded-lg px-2 py-0.5 focus:outline-none w-36"
                      style={{ color: theme.text }}
                    />
                  </div>
                ) : (
                  <p className="text-3xl font-extrabold" style={{ color: theme.text }}>
                    {formatMonthShortLabel(report.yearMonth)}の運用状況：{status}
                  </p>
                )}
                {editingPage1 ? (
                  <textarea
                    value={page1Draft.summary}
                    onChange={(e) => setPage1Draft((d) => ({ ...d, summary: e.target.value }))}
                    rows={2}
                    placeholder="運用状況の一言"
                    className="text-lg text-charcoal-700 mt-2 leading-relaxed w-full bg-transparent border border-dashed border-gray-300 rounded-lg px-2 py-1 focus:outline-none resize-y"
                  />
                ) : (
                  <p className="text-lg text-charcoal-700 mt-2 leading-relaxed whitespace-pre-wrap">
                    {summary || "AI分析はまだ生成されていません"}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-[0.85fr_0.85fr_1.15fr_1.15fr] gap-4 mt-3">
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
            {conversionGroups ? (
              <div className="text-xs leading-relaxed">
                {conversionGroups.map((g, i) => (
                  <p key={g.name} style={{ color: CONVERSION_GROUP_COLORS[i % CONVERSION_GROUP_COLORS.length] }}>
                    <span className="font-semibold">{g.name}：</span>
                    {g.items.map((it) => `${it.channel} ${formatAdaptiveNumber(it.conversions)}回`).join("／")}
                  </p>
                ))}
              </div>
            ) : (
              breakdown.length > 0 && (
                <div className="text-xs text-gray-500 leading-relaxed">
                  <p className="font-semibold text-gray-600">内訳：</p>
                  <p>
                    {breakdown
                      .map((b) => `${simplifyConversionActionName(b.name)} ${formatAdaptiveNumber(b.conversions)}回`)
                      .join("／")}
                  </p>
                </div>
              )
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
            <div className="text-sm text-gray-400 leading-relaxed">
              {benchmark && (
                <p>
                  {businessCategory}平均{benchmark.ownAverage}%
                </p>
              )}
              <p>ココデザインでの目標：{AD_REPORT_TARGET_RATE}%</p>
              {benchmark && <p>全国美容院平均約{NATIONAL_AVERAGE_CVR}%</p>}
            </div>
          </GoogleReportStatCard>
        </div>

        <div className="mt-3">
          <SectionCard px={32}>
            <SectionTitle accent={theme.accent} caption={`() = ${buttonLabel}クリック数`}>
              【年代別】{buttonLabel}を押した割合
            </SectionTitle>
            {(editingPage1 || ageGroupInsight || !isRecruitment) && (
              <div className="flex items-start justify-between gap-4 mb-2">
                {editingPage1 ? (
                  <textarea
                    value={page1Draft.ageGroupInsight}
                    onChange={(e) => setPage1Draft((d) => ({ ...d, ageGroupInsight: e.target.value }))}
                    rows={2}
                    placeholder="年代別の傾向コメント"
                    className="text-sm font-semibold max-w-[340px] w-full bg-transparent border border-dashed border-gray-300 rounded-lg px-2 py-1 focus:outline-none resize-y"
                    style={{ color: "#5B7FA6" }}
                  />
                ) : (
                  ageGroupInsight && (
                    <p className="text-sm font-semibold break-words max-w-[340px]" style={{ color: "#5B7FA6" }}>
                      {ageGroupInsight}
                    </p>
                  )
                )}
                {!isRecruitment && (
                  <div className="text-xs text-gray-500 leading-relaxed shrink-0 space-y-0.5">
                    <p className="flex items-center justify-end gap-1">
                      <img src="/ad-report/crown-gold.png" alt="" className="h-3.5 w-auto" /> = {buttonLabel}を押した割合が最も高い年代
                    </p>
                    <p className="flex items-center justify-end gap-1">
                      <img src="/ad-report/crown-silver.png" alt="" className="h-3.5 w-auto" /> = {buttonLabel}クリック数が最も多い年代
                    </p>
                  </div>
                )}
              </div>
            )}
            <GoogleAgeRateChart
              clicks={report.ageGroupClicks ?? []}
              conversions={report.ageGroupConversions ?? []}
              accent={theme.chartAccent}
              showCrown={!isRecruitment}
            />
          </SectionCard>
        </div>

        <div className="mt-3">
          <SectionCard pb={8} px={32}>
            <SectionTitle accent={theme.accent}>{buttonLabel}を押した割合の推移</SectionTitle>
            <GoogleRateTrendChart
              previousCycle={trend.previousCycle}
              currentCycle={trend.currentCycle}
              previousLabel={trend.previousCycleLabel}
              currentLabel={trend.currentCycleLabel}
              target={isRecruitment ? undefined : AD_REPORT_TARGET_RATE}
              previousColor={theme.chartAccent}
              currentColor={trendCurrentColor}
            />
          </SectionCard>
        </div>

        {isRecruitment && (
          <div className="mt-3">
            <SectionCard pb={8} px={32}>
              <SectionTitle accent={theme.accent}>クリック数の推移</SectionTitle>
              <GoogleClicksTrendChart
                previousCycle={trend.previousCycle}
                currentCycle={trend.currentCycle}
                previousLabel={trend.previousCycleLabel}
                currentLabel={trend.currentCycleLabel}
                previousColor={theme.chartAccent}
                currentColor={trendCurrentColor}
              />
            </SectionCard>
          </div>
        )}

        {!isRecruitment && report.searchTerms && report.searchTerms.length > 0 && (
          <div className="mt-3">
            <SectionCard px={32}>
              <SectionTitle accent={theme.accent}>クリックが多かった検索語句</SectionTitle>
              <p className="text-sm text-gray-400 mb-3">広告からホームページに来るきっかけになった検索語句（サロン名での検索は除外）</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {report.searchTerms.slice(0, 3).map((s, i) => (
                  <div key={s.term} className="flex items-center gap-2 rounded-xl border px-4 py-3" style={{ borderColor: theme.accentSoft }}>
                    <img src={["/ad-report/medal-1.png", "/ad-report/medal-2.png", "/ad-report/medal-3.png"][i]} alt={`${i + 1}位`} className="h-6 w-auto shrink-0" />
                    <span className="text-sm font-semibold text-charcoal-800">{s.term}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-3">KOKODESIGN</p>
      </div>

      {/* 親のspace-y-8によるmargin-topは:not()セレクタ込みで詳細度が高く、
          Tailwindの-mt-Nユーティリティでは上書きできないため、インラインstyleで直接指定する。 */}
      <div className="ad-report-print-hide flex justify-center" style={{ marginTop: 20 }}>
        {editingPage1 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingPage1(false)}
              disabled={savingPage1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
            >
              <X size={13} strokeWidth={2} />
              キャンセル
            </button>
            <button
              onClick={savePage1}
              disabled={savingPage1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
            >
              {savingPage1 ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2} />}
              保存
            </button>
          </div>
        ) : (
          <button
            onClick={startEditPage1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            <Pencil size={15} strokeWidth={2} />
            編集する
          </button>
        )}
      </div>

      {/* ページ2 */}
      <div
        className="ad-report-page ad-report-page-last rounded-3xl px-8 pt-8 pb-4 w-[900px] min-h-[1150px] max-w-none mx-auto flex flex-col justify-center space-y-8"
        style={{ background: theme.bg }}
      >
        <SectionCard pt={42} pb={42} px={32}>
          <SectionTitle accent={theme.accent}>サロン様へのご提案</SectionTitle>
          {editingPage2 ? (
            <>
              <input
                type="text"
                value={page2Draft.ownerSuggestion.headline}
                onChange={(e) =>
                  setPage2Draft((d) => ({ ...d, ownerSuggestion: { ...d.ownerSuggestion, headline: e.target.value } }))
                }
                placeholder="見出し"
                className="text-3xl font-bold text-charcoal-900 mt-2 mb-3 w-full bg-transparent border border-dashed border-gray-300 rounded-lg px-2 py-1 focus:outline-none"
              />
              <textarea
                value={page2Draft.ownerSuggestion.body}
                onChange={(e) =>
                  setPage2Draft((d) => ({ ...d, ownerSuggestion: { ...d.ownerSuggestion, body: e.target.value } }))
                }
                rows={4}
                placeholder="本文"
                className="text-[17px] text-charcoal-700 leading-relaxed w-full bg-transparent border border-dashed border-gray-300 rounded-lg px-2 py-1 focus:outline-none resize-y"
              />
              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                {[0, 1].map((i) => (
                  <PillEditor
                    key={i}
                    pill={page2Draft.ownerSuggestion.pills[i] ?? DEFAULT_PILL}
                    accent={theme.accent}
                    onChange={(pill) =>
                      setPage2Draft((d) => {
                        const pills = [d.ownerSuggestion.pills[0] ?? DEFAULT_PILL, d.ownerSuggestion.pills[1] ?? DEFAULT_PILL];
                        pills[i] = pill;
                        return { ...d, ownerSuggestion: { ...d.ownerSuggestion, pills } };
                      })
                    }
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {ownerSuggestion.headline && (
                <p className="text-3xl font-bold text-charcoal-900 mt-2 mb-3">{ownerSuggestion.headline}</p>
              )}
              <p className="text-[17px] text-charcoal-700 leading-relaxed whitespace-pre-wrap">
                {ownerSuggestion.body || (!ownerSuggestion.headline && "AI分析はまだ生成されていません")}
              </p>
              {ownerSuggestion.pills.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  {ownerSuggestion.pills.map((pill, i) => {
                    const Icon = PILL_ICON_COMPONENTS[pill.icon];
                    return (
                      <div
                        key={i}
                        className="flex-1 flex items-center gap-3 rounded-xl border-[3px] px-6 py-4"
                        style={{ borderColor: theme.accent }}
                      >
                        <Icon size={24} strokeWidth={2} style={{ color: theme.accent }} />
                        <span className="text-lg text-charcoal-800">{pill.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </SectionCard>

        <SectionCard pt={42} pb={42} px={32}>
          <SectionTitle accent={theme.accent}>ココデザインが行う改善策</SectionTitle>
          {editingPage2 ? (
            <>
              <input
                type="text"
                value={page2Draft.agencyAction.headline}
                onChange={(e) =>
                  setPage2Draft((d) => ({ ...d, agencyAction: { ...d.agencyAction, headline: e.target.value } }))
                }
                placeholder="見出し"
                className="text-3xl font-bold text-charcoal-900 mt-2 mb-3 w-full bg-transparent border border-dashed border-gray-300 rounded-lg px-2 py-1 focus:outline-none"
              />
              <textarea
                value={page2Draft.agencyAction.body}
                onChange={(e) =>
                  setPage2Draft((d) => ({ ...d, agencyAction: { ...d.agencyAction, body: e.target.value } }))
                }
                rows={4}
                placeholder="本文"
                className="text-[17px] text-charcoal-700 leading-relaxed w-full bg-transparent border border-dashed border-gray-300 rounded-lg px-2 py-1 focus:outline-none resize-y"
              />
              <div className="flex flex-col sm:flex-row gap-3 mt-5">
                {[0, 1].map((i) => (
                  <PillEditor
                    key={i}
                    pill={page2Draft.agencyAction.pills[i] ?? DEFAULT_PILL}
                    accent={theme.accent}
                    onChange={(pill) =>
                      setPage2Draft((d) => {
                        const pills = [d.agencyAction.pills[0] ?? DEFAULT_PILL, d.agencyAction.pills[1] ?? DEFAULT_PILL];
                        pills[i] = pill;
                        return { ...d, agencyAction: { ...d.agencyAction, pills } };
                      })
                    }
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {agencyAction.headline && (
                <p className="text-3xl font-bold text-charcoal-900 mt-2 mb-3">{agencyAction.headline}</p>
              )}
              <p className="text-[17px] text-charcoal-700 leading-relaxed whitespace-pre-wrap">
                {agencyAction.body || (!agencyAction.headline && "AI分析はまだ生成されていません")}
              </p>
              {agencyAction.pills.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  {agencyAction.pills.map((pill, i) => {
                    const Icon = PILL_ICON_COMPONENTS[pill.icon];
                    return (
                      <div
                        key={i}
                        className="flex-1 flex items-center gap-3 rounded-xl border-[3px] px-6 py-4"
                        style={{ borderColor: theme.accent }}
                      >
                        <Icon size={24} strokeWidth={2} style={{ color: theme.accent }} />
                        <span className="text-lg text-charcoal-800">{pill.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </SectionCard>

        <SectionCard pt={42} pb={42} px={32}>
          <SectionTitle accent={theme.accent}>ご確認・ご返信のお願い</SectionTitle>
          <p className="text-3xl font-bold text-charcoal-900 mt-2 mb-3">
            {isRecruitment ? "実際の求人反応をぜひご共有ください。" : "実際のご予約数をぜひご共有ください。"}
          </p>
          <p className="text-[17px] text-charcoal-700 leading-relaxed">
            {isRecruitment
              ? "LINE・Instagram・電話などから、求人に関するお問い合わせや応募がございましたら、ご共有いただけますと幸いです。また、応募者の方の反応など新しい情報がございましたらお伝えください。"
              : "電話やHPB・WEBでのご予約、ライン友達の増加など、アクションの変化などございましたら、お伝えいただけますと幸いです。また、ご来店いただいたお客様からの新しい情報などございましたらお伝えください。"}
          </p>
          <p className="text-base font-semibold mt-5 mb-3" style={{ color: theme.text }}>
            {isRecruitment ? "求人に関する反応はいかがでしたでしょうか？" : "実際にサロン様では前月と比べていかがでしたでしょうか？"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {confirmOptions.map((opt, i) => (
              <div
                key={opt}
                className="flex-1 flex items-center gap-3 rounded-xl border-[3px] px-6 py-4"
                style={{ borderColor: theme.accent }}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: theme.accent }}
                >
                  {i + 1}
                </span>
                <span className="text-lg text-charcoal-800">{opt}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <p className="text-center text-sm text-gray-400 mt-3">KOKODESIGN</p>
      </div>

      {/* 親のspace-y-8によるmargin-topは:not()セレクタ込みで詳細度が高く、
          Tailwindの-mt-Nユーティリティでは上書きできないため、インラインstyleで直接指定する。 */}
      <div className="ad-report-print-hide flex justify-center" style={{ marginTop: 20 }}>
        {editingPage2 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingPage2(false)}
              disabled={savingPage2}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
            >
              <X size={13} strokeWidth={2} />
              キャンセル
            </button>
            <button
              onClick={savePage2}
              disabled={savingPage2}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
            >
              {savingPage2 ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2} />}
              保存
            </button>
          </div>
        ) : (
          <button
            onClick={startEditPage2}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            <Pencil size={15} strokeWidth={2} />
            編集する
          </button>
        )}
      </div>
    </div>
  );
}
