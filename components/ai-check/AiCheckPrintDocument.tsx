import { ReactNode } from "react";
import {
  AI_CHECK_CATEGORY_LABEL,
  AI_CHECK_RANK_INFO,
  AiCheckCategoryId,
  AiCheckRank,
  AiCheckRecommendation,
} from "@/lib/ai-check/types";

const ACCENT = "#5B9BD5";

const PRIORITY_STYLES = {
  high: { label: "優先度：高", bg: "#fef2f2", text: "#dc2626", border: "#fecaca", dot: "#f87171" },
  medium: { label: "優先度：中", bg: "#fffbeb", text: "#d97706", border: "#fde68a", dot: "#fbbf24" },
  low: { label: "優先度：低", bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", dot: "#4ade80" },
};

interface CategoryScoreRow {
  categoryId: AiCheckCategoryId;
  score: number;
  maxScore: number;
}

interface AiCheckPrintDocumentProps {
  url: string;
  totalScore: number;
  scoreMax: number;
  rank: AiCheckRank | null;
  summary: string;
  target: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: AiCheckRecommendation[];
  categoryScores: CategoryScoreRow[];
  createdAt: string;
}

function SectionCard({ children, px = 28, py = 22 }: { children: ReactNode; px?: number; py?: number }) {
  return (
    <div className="bg-white rounded-2xl" style={{ padding: `${py}px ${px}px` }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ width: 6, height: 20, borderRadius: 999, backgroundColor: ACCENT, display: "inline-block" }} />
      <p style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>{children}</p>
    </div>
  );
}

// PDF保存専用の静止レイアウト。lib/growth-db/store-detail/DiagnosisReportDocument.tsxと
// 同じ「密度の高い固定ページ」の思想を採用（1ページ=900px幅・可変の最小高さのdivを
// data-print-sectionではなくad-report-pageクラスで明示し、ブラウザのネイティブ印刷
// （window.print）でそのままPDF化する）。旧実装（narrow 480px、カードをそのまま縦に
// 並べてhtml-to-image+jsPDFでA4高さ毎に機械的に切る方式）は、/resultのDiagnosisPrintDocument
// と同じ「スクリーンショットを撮っているだけ」の見た目になり、内容量次第でページ数が
// 不可解に増減する問題があったため、ページ数を内容に応じて自分で決める今の方式に変更した。
export default function AiCheckPrintDocument({
  url,
  totalScore,
  scoreMax,
  rank,
  summary,
  target,
  strengths,
  weaknesses,
  recommendations,
  categoryScores,
  createdAt,
}: AiCheckPrintDocumentProps) {
  const isPro = rank !== null;
  const rankInfo = rank ? AI_CHECK_RANK_INFO[rank] : null;
  const percentage = Math.round((totalScore / scoreMax) * 100);
  const dateLabel = new Date(createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  const hasSummaryPage = isPro && (!!summary || strengths.length > 0 || weaknesses.length > 0);
  const hasRecommendationsPage = isPro && recommendations.length > 0;

  // 幅はw-[900px]固定ではなくw-full max-w-[900px]にしている。handlePdf側で@pageに
  // 900px幅を指定しても、ブラウザのネイティブ印刷ダイアログ（window.print）はデフォルトの
  // 用紙サイズ（Letterは816px相当など）を優先し、カスタム@pageのwidthを無視することが
  // 実機検証で判明した。固定900px幅のままだと、その場合に3列目のカード内容が用紙の右端で
  // 切れてしまうため、実際の印刷幅に追従できるようにしている（@pageの指定自体は、
  // ブラウザ側が尊重してくれる場合に備えて残している）。
  const pageClass = "ad-report-page rounded-3xl px-10 pt-9 pb-5 w-full max-w-[900px] min-h-[1150px] mx-auto flex flex-col justify-center";

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
      {/* ページ1: ヘッダー・総合スコア・カテゴリ別スコア（常に表示） */}
      <div className={`${pageClass} ${!hasSummaryPage && !hasRecommendationsPage ? "ad-report-page-last" : ""}`} style={{ background: "#FAF8F3" }}>
        <p style={{ color: ACCENT, fontSize: 12, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", textAlign: "center" }}>
          SALON AI CHECK
        </p>
        <h1 className="text-[30px] font-extrabold text-center text-charcoal-900 mt-1">
          {isPro ? "プロ診断" : "基礎診断"}レポート
        </h1>
        <p className="text-center text-sm text-gray-500 mt-3 break-all">{url}</p>
        <p className="text-center text-xs text-gray-400 mt-1">{dateLabel}実施</p>

        <div className="mt-6">
          <SectionCard px={32} py={20}>
            <div className="flex items-center gap-8">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center shrink-0 text-white font-extrabold"
                style={{
                  fontSize: isPro ? 28 : 22,
                  background: `linear-gradient(135deg, ${rankInfo ? rankInfo.color : ACCENT} 0%, ${rankInfo ? rankInfo.color : ACCENT}cc 100%)`,
                }}
              >
                {isPro ? rank : `${percentage}%`}
              </div>
              <div className="flex-1">
                <p className="text-2xl font-extrabold" style={{ color: ACCENT }}>
                  {isPro ? `総合スコア：${totalScore}/${scoreMax}点（${rankInfo?.label}）` : `基礎スコア：${totalScore}/${scoreMax}点`}
                </p>
                <p className="text-sm text-charcoal-700 mt-2 leading-relaxed">
                  {isPro ? rankInfo?.description : "機械的に判定できる項目のみの基礎スコアです（ランク判定はプロ診断で表示されます）"}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="mt-4">
          <SectionCard px={32} py={22}>
            <SectionTitle>カテゴリ別スコア</SectionTitle>
            <div className="grid grid-cols-3 gap-4 mt-3">
              {categoryScores.map((c) => {
                const pct = Math.round((c.score / c.maxScore) * 100);
                return (
                  <div key={c.categoryId} className="rounded-xl border border-gray-100 px-4 py-3">
                    <p className="text-sm font-semibold text-charcoal-900 truncate mb-1.5">{AI_CHECK_CATEGORY_LABEL[c.categoryId]}</p>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs text-gray-400">
                        {c.score} / {c.maxScore}
                      </span>
                      <span className="text-sm font-bold" style={{ color: ACCENT }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: ACCENT }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">KOKODESIGN</p>
      </div>

      {/* ページ2: AIコメント・強み弱み（プロ診断のみ） */}
      {hasSummaryPage && (
        <div className={`${pageClass} ${!hasRecommendationsPage ? "ad-report-page-last" : ""}`} style={{ background: "#FAF8F3" }}>
          {summary && (
            <div className="mb-4">
              <SectionCard px={32} py={24}>
                <SectionTitle>AIから見たあなたの美容室</SectionTitle>
                <p className="text-sm text-charcoal-800 leading-relaxed">{summary}</p>
                {target && (
                  <p className="text-xs text-gray-500 mt-3">
                    <span className="font-semibold text-charcoal-700">想定ターゲット：</span>
                    {target}
                  </p>
                )}
              </SectionCard>
            </div>
          )}

          {(strengths.length > 0 || weaknesses.length > 0) && (
            <SectionCard px={32} py={24}>
              <SectionTitle>強みと弱みのサマリー</SectionTitle>
              <div className="grid grid-cols-2 gap-6 mt-2">
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#16a34a" }}>
                    AIが理解できていること
                  </p>
                  <div className="space-y-2">
                    {strengths.map((s, i) => (
                      <div key={i} className="rounded-lg px-3 py-2" style={{ background: "#f0fdf4" }}>
                        <span className="text-xs leading-relaxed" style={{ color: "#166534" }}>
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#ef4444" }}>
                    AIが理解できていないこと
                  </p>
                  <div className="space-y-2">
                    {weaknesses.map((w, i) => (
                      <div key={i} className="rounded-lg px-3 py-2" style={{ background: "#fef2f2" }}>
                        <span className="text-xs leading-relaxed" style={{ color: "#991b1b" }}>
                          {w}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          <p className="text-center text-xs text-gray-400 mt-3">KOKODESIGN</p>
        </div>
      )}

      {/* ページ3: 改善提案（プロ診断のみ・最終ページ） */}
      {hasRecommendationsPage && (
        <div className={`${pageClass} ad-report-page-last`} style={{ background: "#FAF8F3" }}>
          <SectionCard px={32} py={24}>
            <SectionTitle>改善提案（{recommendations.length}件）</SectionTitle>
            <div className="grid grid-cols-2 gap-4 mt-3">
              {recommendations.map((rec, i) => {
                const priority = PRIORITY_STYLES[rec.priority];
                return (
                  <div key={i} className="rounded-xl border border-gray-100 px-4 py-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white"
                        style={{ backgroundColor: ACCENT }}
                      >
                        {rec.category}
                      </span>
                      <span
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                        style={{ color: priority.text, backgroundColor: priority.bg, borderColor: priority.border }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: priority.dot, display: "inline-block" }} />
                        {priority.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-charcoal-900 leading-snug mb-1.5">{rec.problem}</p>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2">{rec.reason}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      <span className="font-semibold text-charcoal-700">アクション：</span>
                      {rec.solution}
                    </p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <div className="mt-4 rounded-2xl p-6" style={{ background: "#1a1a1a" }}>
            <p className="text-white font-bold text-base leading-relaxed mb-1.5">プロと一緒にAI対策を進めませんか？</p>
            <p className="text-xs leading-relaxed mb-2" style={{ color: "#9ca3af" }}>
              診断結果をもとに、具体的な改善アクションをご提案します。無料相談は30分から。
            </p>
            <p className="text-xs font-semibold" style={{ color: ACCENT }}>
              koko-design.com/contact
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">KOKODESIGN</p>
        </div>
      )}
    </div>
  );
}
