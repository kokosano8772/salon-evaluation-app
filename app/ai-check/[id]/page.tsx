"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Sparkles, TrendingUp, Target } from "lucide-react";
import {
  AI_CHECK_CATEGORY_LABEL,
  AI_CHECK_RANK_INFO,
  AiCheckCategoryId,
  AiCheckRank,
  AiCheckRecommendation,
  DiagnosisItemStatus,
} from "@/lib/ai-check/types";

interface DiagnosisItemRow {
  id: string;
  categoryId: AiCheckCategoryId;
  label: string;
  maxScore: number;
  score: number;
  status: DiagnosisItemStatus;
}

interface CategoryScoreRow {
  categoryId: AiCheckCategoryId;
  score: number;
  maxScore: number;
}

interface DiagnosisRecord {
  id: string;
  url: string;
  total_score: number;
  rank: AiCheckRank;
  summary: string;
  target: string;
  strengths: string[];
  weaknesses: string[];
  missing_information: string[];
  recommendations: AiCheckRecommendation[];
  category_scores: CategoryScoreRow[];
  diagnosis_items: DiagnosisItemRow[];
  crawl_warning: string | null;
  created_at: string;
}

const PRIORITY_LABEL: Record<AiCheckRecommendation["priority"], { label: string; bg: string; text: string; border: string }> = {
  high: { label: "優先度：高", bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  medium: { label: "優先度：中", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  low: { label: "優先度：低", bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
};

export default function AiCheckResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [diagnosis, setDiagnosis] = useState<DiagnosisRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/ai-check/diagnose/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "取得に失敗しました");
        setDiagnosis(json.diagnosis);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "取得に失敗しました"));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#FAF8F3] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <Link href="/ai-check" className="text-sm font-medium" style={{ color: "#C4788A" }}>
          もう一度診断する
        </Link>
      </div>
    );
  }

  if (!diagnosis) {
    return <div className="min-h-[100dvh] bg-[#FAF8F3]" />;
  }

  const rankInfo = AI_CHECK_RANK_INFO[diagnosis.rank];
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference * (1 - diagnosis.total_score / 100);

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F3] flex flex-col">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-40">
        <p className="text-xs font-medium text-[#C4788A] tracking-widest uppercase text-center">AI SALON CHECK</p>
      </div>

      <main className="flex-1 px-5 py-8 max-w-md mx-auto w-full space-y-6">
        {diagnosis.crawl_warning && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">{diagnosis.crawl_warning}</p>
          </div>
        )}

        {/* スコア */}
        <section className="flex flex-col items-center">
          <p className="text-xs text-gray-400 mb-4 break-all text-center">{diagnosis.url}</p>
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f0ede6" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="52" fill="none" stroke={rankInfo.color} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: rankInfo.color }}>{diagnosis.total_score}</span>
              <span className="text-gray-400 text-xs">/ 100点</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col items-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ background: `linear-gradient(135deg, ${rankInfo.color} 0%, ${rankInfo.color}cc 100%)` }}
            >
              {diagnosis.rank}
            </div>
            <p className="mt-2 font-semibold text-charcoal-900 text-sm">{rankInfo.label}</p>
            <p className="text-gray-500 text-xs mt-1">{rankInfo.description}</p>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
            ※本スコアはAI検索順位を保証するものではありません。AIが店舗の情報を理解・評価するために
            必要と考えられる情報の充実度を独自基準で診断したものです。
          </p>
        </section>

        {/* カテゴリ別スコア */}
        <section className="card-luxury p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">カテゴリー別スコア</p>
          <div className="space-y-3">
            {diagnosis.category_scores.map((c) => (
              <div key={c.categoryId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-charcoal-800">{AI_CHECK_CATEGORY_LABEL[c.categoryId]}</span>
                  <span className="text-sm font-bold" style={{ color: rankInfo.color }}>{c.score} / {c.maxScore}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(c.score / c.maxScore) * 100}%`, backgroundColor: rankInfo.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AIから見たあなたの美容室 */}
        {diagnosis.summary && (
          <section className="card-luxury p-5">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles size={14} className="text-[#C4788A]" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">AIから見たあなたの美容室</p>
            </div>
            <p className="text-sm text-charcoal-800 leading-relaxed mb-3">{diagnosis.summary}</p>
            {diagnosis.target && (
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-charcoal-700">想定ターゲット：</span>
                {diagnosis.target}
              </p>
            )}
          </section>
        )}

        {/* 強み・弱み */}
        {(diagnosis.strengths.length > 0 || diagnosis.weaknesses.length > 0) && (
          <section className="card-luxury p-5">
            {diagnosis.strengths.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={13} className="text-green-600" />
                  <p className="text-xs font-semibold text-green-600">AIが理解できていること</p>
                </div>
                <div className="space-y-1.5">
                  {diagnosis.strengths.map((s, i) => (
                    <div key={i} className="bg-green-50 rounded-lg px-3 py-2 text-xs text-green-800">{s}</div>
                  ))}
                </div>
              </div>
            )}
            {diagnosis.weaknesses.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Target size={13} className="text-red-500" />
                  <p className="text-xs font-semibold text-red-500">AIが理解できていないこと</p>
                </div>
                <div className="space-y-1.5">
                  {diagnosis.weaknesses.map((w, i) => (
                    <div key={i} className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-800">{w}</div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* 改善提案 */}
        {diagnosis.recommendations.length > 0 && (
          <section>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3 px-1">
              優先改善ポイント TOP{diagnosis.recommendations.length}
            </p>
            <div className="space-y-3">
              {diagnosis.recommendations.map((rec, i) => {
                const priority = PRIORITY_LABEL[rec.priority];
                return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-gray-300">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-xs font-medium text-charcoal-600">{rec.category}</span>
                        <span className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-full border ${priority.bg} ${priority.text} ${priority.border}`}>
                          {priority.label}
                        </span>
                      </div>
                      <p className="text-charcoal-900 font-bold text-sm leading-snug mb-2">{rec.problem}</p>
                      <p className="text-gray-500 text-xs leading-relaxed">{rec.reason}</p>
                    </div>
                    <div className="mx-4 mb-4 bg-[#FAF8F3] rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: "#C4788A" }}
                        >
                          <Check size={10} strokeWidth={2.5} color="white" />
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{rec.solution}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="text-center pt-4">
          <Link href="/ai-check" className="text-xs font-medium" style={{ color: "#C4788A" }}>
            別のサイトを診断する
          </Link>
        </div>
      </main>
    </div>
  );
}
