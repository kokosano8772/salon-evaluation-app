"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ClipboardCheck } from "lucide-react";
import { useDiagnosisResults } from "@/lib/growth-db/hooks";
import * as repo from "@/lib/growth-db/repository";
import { formatMonthLabel } from "@/lib/growth-db/format";
import { generateImprovements } from "@/lib/recommendations";
import { CATEGORIES } from "@/lib/scoring";
import CategoryScoreBar from "@/components/result/CategoryScoreBar";
import ImprovementCard from "@/components/result/ImprovementCard";

// 詳細診断(/diagnosis)から連携された結果の参照カード。
// あくまで参考情報であり、独自診断スコア(GrowthScore)の計算には使用しない。
export default function LinkedDiagnosisCard({ storeId }: { storeId: string }) {
  const { items, loading, refresh } = useDiagnosisResults(storeId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading || items.length === 0) return null;

  const handleMarkReviewed = async (id: string) => {
    await repo.markDiagnosisResultReviewed(id);
    refresh();
  };

  return (
    <div className="card-luxury p-5">
      <p className="text-xs font-medium text-gray-400 tracking-wide mb-4 flex items-center gap-1.5">
        <ClipboardCheck size={14} strokeWidth={2} />
        詳細診断の連携結果（参考情報・独自診断スコアには反映されません）
      </p>
      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          const improvements = generateImprovements(item.categoryScores);

          return (
            <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-charcoal-900">
                    {item.totalScore}点（{item.rank}ランク）
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatMonthLabel(item.completedAt.slice(0, 7))}実施
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.status === "pending" ? (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkReviewed(item.id);
                      }}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200"
                    >
                      未確認
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                      <CheckCircle2 size={12} strokeWidth={2} />
                      確認済み
                    </span>
                  )}
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-5 pt-1 space-y-5 bg-[#FAF8F3]">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      カテゴリ別スコア
                    </p>
                    <CategoryScoreBar categoryScores={item.categoryScores} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      回答内容（{Object.keys(item.answers).length}問）
                    </p>
                    <div className="space-y-4">
                      {CATEGORIES.map((cat) => {
                        const answered = cat.questions.filter((q) => item.answers[q.id] !== undefined);
                        if (answered.length === 0) return null;
                        return (
                          <div key={cat.id}>
                            <p className="text-xs font-semibold mb-2" style={{ color: cat.color }}>
                              {cat.name}
                            </p>
                            <div className="space-y-2">
                              {answered.map((q) => {
                                const idx = item.answers[q.id];
                                const optionLabel = q.options?.[idx];
                                const optionDesc = q.optionDescriptions?.[idx];
                                return (
                                  <div key={q.id} className="bg-white rounded-lg border border-gray-100 px-3 py-2.5">
                                    <p className="text-xs text-gray-500 mb-1">{q.label}</p>
                                    <p className="text-sm font-medium text-charcoal-900">
                                      {optionLabel ?? `選択肢${idx}`}
                                    </p>
                                    {optionDesc && (
                                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">{optionDesc}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      改善提案（{improvements.length}件）
                    </p>
                    <div className="space-y-3">
                      {improvements.map((imp, i) => (
                        <ImprovementCard key={i} improvement={imp} index={i} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
