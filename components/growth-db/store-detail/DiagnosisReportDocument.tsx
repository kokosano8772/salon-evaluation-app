import { ReactNode } from "react";
import { CategoryScore, DiagnosisAnswers, Improvement } from "@/lib/types";
import { RankInfo } from "@/lib/types";
import { CATEGORIES } from "@/lib/scoring";
import CategoryIcon from "@/components/ui/CategoryIcon";
import dynamic from "next/dynamic";

const SalonRadarChart = dynamic(() => import("@/components/result/SalonRadarChart"), { ssr: false });

const PRIORITY_LABEL: Record<Improvement["priority"], { label: string; color: string }> = {
  high: { label: "優先度：高", color: "#dc2626" },
  medium: { label: "優先度：中", color: "#d97706" },
  low: { label: "優先度：低", color: "#16a34a" },
};

function SectionCard({ children, px, py }: { children: ReactNode; px?: number; py?: number }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ paddingLeft: px, paddingRight: px, paddingTop: py, paddingBottom: py }}>
      {children}
    </div>
  );
}

function SectionTitle({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-1.5 h-5 rounded-full" style={{ backgroundColor: accent }} />
      <p className="text-lg font-bold text-charcoal-900">{children}</p>
    </div>
  );
}

interface DiagnosisReportDocumentProps {
  salonName: string;
  completedAt: string;
  totalScore: number;
  rank: string;
  rankInfo: RankInfo;
  categoryScores: CategoryScore[];
  improvements: Improvement[];
  answers: DiagnosisAnswers;
}

const ACCENT = "#C4788A";

// 成長データベースの診断連携結果を、Google広告レポートと同じ「密度の高い固定ページ」の
// 思想で印刷・PDF保存できるようにしたレポート。既存の/resultページ用の
// DiagnosisPrintDocument（スマホアプリのカードをそのまま縦に並べただけ）とは別物で、
// 1件の診断結果をA4相当2〜3ページ程度に収まる密度で再設計している。
export default function DiagnosisReportDocument({
  salonName,
  completedAt,
  totalScore,
  rank,
  rankInfo,
  categoryScores,
  improvements,
  answers,
}: DiagnosisReportDocumentProps) {
  return (
    <div className="space-y-8">
      {/* ページ1: 総合スコア・カテゴリ別・レーダーチャート */}
      <div
        className="ad-report-page rounded-3xl px-8 pt-8 pb-4 w-[900px] min-h-[1150px] max-w-none mx-auto flex flex-col justify-center"
        style={{ background: "#FAF8F3" }}
      >
        <h1 className="text-[36px] font-extrabold text-center text-charcoal-900">美容室価値診断レポート</h1>
        <p className="text-center text-base text-charcoal-700 mt-2">
          {salonName}様 |{" "}
          {new Date(completedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}実施
        </p>

        <div className="mt-4">
          <SectionCard px={32} py={20}>
            <div className="flex items-center gap-6">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center shrink-0 text-3xl font-extrabold text-white"
                style={{ background: `linear-gradient(135deg, ${rankInfo.color} 0%, ${rankInfo.color}cc 100%)` }}
              >
                {rank}
              </div>
              <div className="flex-1">
                <p className="text-3xl font-extrabold" style={{ color: ACCENT }}>
                  総合スコア：{totalScore}点（{rankInfo.label}）
                </p>
                <p className="text-base text-charcoal-700 mt-1.5 leading-relaxed">{rankInfo.description}</p>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="mt-3">
          <SectionCard px={32} py={20}>
            <SectionTitle accent={ACCENT}>カテゴリ別スコア</SectionTitle>
            <div className="grid grid-cols-3 gap-4">
              {categoryScores.map((cs) => {
                const category = CATEGORIES.find((c) => c.id === cs.categoryId);
                return (
                  <div key={cs.categoryId} className="rounded-xl border border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      {category && (
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cs.color}18` }}
                        >
                          <CategoryIcon icon={category.icon} size={13} color={cs.color} strokeWidth={1.8} />
                        </div>
                      )}
                      <span className="text-sm font-semibold text-charcoal-900 truncate">{cs.name}</span>
                    </div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs text-gray-400">
                        {cs.score} / {cs.maxScore}
                      </span>
                      <span className="text-sm font-bold" style={{ color: cs.color }}>
                        {cs.percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${cs.percentage}%`, backgroundColor: cs.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="mt-3">
          <SectionCard px={32} py={16}>
            <SectionTitle accent={ACCENT}>レーダーチャート</SectionTitle>
            <div className="flex justify-center">
              <SalonRadarChart categoryScores={categoryScores} animate={false} width={680} height={340} />
            </div>
          </SectionCard>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">KOKODESIGN</p>
      </div>

      {/* ページ2: 回答内容（カテゴリ別・コンパクトな2列グリッド） */}
      <div
        className="ad-report-page rounded-3xl px-8 pt-8 pb-4 w-[900px] min-h-[1150px] max-w-none mx-auto flex flex-col justify-center"
        style={{ background: "#FAF8F3" }}
      >
        <SectionCard px={36} py={28}>
          <SectionTitle accent={ACCENT}>回答内容</SectionTitle>
          <div className="grid grid-cols-3 gap-x-10 gap-y-7">
            {CATEGORIES.map((cat) => {
              const answered = cat.questions.filter((q) => answers[q.id] !== undefined);
              if (answered.length === 0) return null;
              return (
                <div key={cat.id}>
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white mb-3"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon icon={cat.icon} size={14} color="white" strokeWidth={2} />
                    {cat.name}
                  </div>
                  <div className="space-y-2.5">
                    {answered.map((q) => {
                      const idx = answers[q.id];
                      const optionLabel = q.options?.[idx];
                      return (
                        <div key={q.id} className="rounded-xl border border-gray-100 px-4 py-3 leading-snug">
                          <p className="text-xs text-gray-400 mb-0.5">{q.label}</p>
                          <p className="text-sm font-semibold text-charcoal-900">{optionLabel ?? `選択肢${idx}`}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <p className="text-center text-xs text-gray-400 mt-3">KOKODESIGN</p>
      </div>

      {/* ページ3: 改善提案（コンパクトな2列グリッド） */}
      <div
        className="ad-report-page ad-report-page-last rounded-3xl px-8 pt-8 pb-4 w-[900px] min-h-[1150px] max-w-none mx-auto flex flex-col justify-center"
        style={{ background: "#FAF8F3" }}
      >
        <SectionCard px={32} py={24}>
          <SectionTitle accent={ACCENT}>改善提案（{improvements.length}件）</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {improvements.map((imp, i) => {
              const category = CATEGORIES.find((c) => c.id === imp.categoryId);
              const color = category?.color ?? "#999";
              const priority = PRIORITY_LABEL[imp.priority];
              return (
                <div key={i} className="rounded-xl border border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-white shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {category && <CategoryIcon icon={category.icon} size={10} color="white" strokeWidth={2} />}
                      {category?.name}
                    </div>
                    <span className="text-[11px] font-medium shrink-0" style={{ color: priority.color }}>
                      {priority.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-charcoal-900 leading-snug mb-1">{imp.title}</p>
                  <p className="text-xs text-gray-600 leading-snug mb-1.5">{imp.description}</p>
                  <p className="text-xs text-gray-500 leading-snug">
                    <span className="font-semibold text-charcoal-700">アクション：</span>
                    {imp.action}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <p className="text-center text-xs text-gray-400 mt-3">KOKODESIGN</p>
      </div>
    </div>
  );
}
