"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Target,
  Share2,
  ArrowRight,
  Check,
  MapPin,
  Star,
  ListChecks,
  Globe,
  MessageCircleQuestion,
  Users,
  MessageSquareText,
  Bot,
} from "lucide-react";
import {
  AI_CHECK_CATEGORY_LABEL,
  AI_CHECK_RANK_INFO,
  AiCheckCategoryId,
  AiCheckRank,
  AiCheckRecommendation,
  DiagnosisItemStatus,
} from "@/lib/ai-check/types";

// 美容室価値診断と同じシリーズとして、結果画面の「見せ方」（ヘッダー/スコアヒーロー/
// タブ構成/下部アクションバー）はapp/(diagnosis)/result/page.tsxに合わせている。
// アクセントカラーのみ青系（#5B9BD5）でAI Check専用に差別化。
const ACCENT = "#5B9BD5";
const ACCENT_DARK = "#4A82B5";

const CATEGORY_ICON: Record<AiCheckCategoryId, typeof MapPin> = {
  store_info: MapPin,
  specialty: Star,
  menu: ListChecks,
  web_structure: Globe,
  content_faq: MessageCircleQuestion,
  staff: Users,
  google_reviews: MessageSquareText,
  ai_search: Bot,
};

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

const PRIORITY_STYLES: Record<AiCheckRecommendation["priority"], { label: string; bg: string; text: string; border: string; dot: string }> = {
  high: { label: "優先度：高", bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-400" },
  medium: { label: "優先度：中", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", dot: "bg-amber-400" },
  low: { label: "優先度：低", bg: "bg-green-50", text: "text-green-600", border: "border-green-200", dot: "bg-green-400" },
};

const CARD_STYLE: React.CSSProperties = { borderColor: `${ACCENT}33`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" };

export default function AiCheckResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [diagnosis, setDiagnosis] = useState<DiagnosisRecord | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "detail" | "action">("overview");
  const [displayScore, setDisplayScore] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fetch(`/api/ai-check/diagnose/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "取得に失敗しました");
        setDiagnosis(json.diagnosis);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "取得に失敗しました"));
  }, [id]);

  useEffect(() => {
    if (!diagnosis) return;
    const duration = 1800;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(diagnosis.total_score * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [diagnosis]);

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-[#F5F8FA] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <Link href="/ai-check" className="text-sm font-medium" style={{ color: ACCENT }}>
          もう一度診断する
        </Link>
      </div>
    );
  }

  if (!diagnosis) {
    return <div className="min-h-[100dvh] bg-[#F5F8FA]" />;
  }

  const rankInfo = AI_CHECK_RANK_INFO[diagnosis.rank];
  const highPriorityCount = diagnosis.recommendations.filter((r) => r.priority === "high").length;
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference * (1 - displayScore / 100);

  const handleShare = async () => {
    const text = `Salon AI Checkで${diagnosis.total_score}点（${rankInfo.label}）でした！`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Salon AI Check 診断結果", text, url: window.location.href });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      alert("URLをコピーしました");
    }
  };

  const TABS = [
    { id: "overview", label: "サマリー" },
    { id: "detail", label: "詳細スコア" },
    { id: "action", label: `改善提案 (${diagnosis.recommendations.length})` },
  ] as const;

  return (
    <div className="min-h-[100dvh] bg-[#F5F8FA] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/ai-check" className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={16} strokeWidth={1.8} />
          <span className="text-xs">トップ</span>
        </Link>
        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: ACCENT }}>
          AI CHECK結果
        </p>
        <Link href="/ai-check" className="flex items-center gap-1 text-gray-400 text-xs">
          <RotateCcw size={12} strokeWidth={1.8} />
          再診断
        </Link>
      </div>

      <main className="flex-1 pb-28">
        {/* Score Hero */}
        <section
          className="px-5 pt-10 pb-8 flex flex-col items-center relative overflow-hidden"
          style={{ background: "linear-gradient(180deg, white 0%, #F5F8FA 100%)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-2 text-center"
          >
            <p className="text-xs font-medium tracking-[0.3em] uppercase mb-1" style={{ color: ACCENT }}>
              Salon AI Check
            </p>
            <p className="text-gray-500 text-xs break-all px-6">{diagnosis.url}</p>
          </motion.div>

          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#eef2f5" strokeWidth="6" />
                <motion.circle
                  cx="60" cy="60" r="52" fill="none" stroke={ACCENT} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.8, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-5xl font-bold"
                  style={{ color: ACCENT }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                >
                  {displayScore}
                </motion.span>
                <span className="text-gray-400 text-sm mt-0.5">/ 100点</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="mt-5 flex flex-col items-center"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
                style={{ background: `linear-gradient(135deg, ${rankInfo.color} 0%, ${rankInfo.color}cc 100%)`, boxShadow: `0 8px 24px ${rankInfo.color}50` }}
              >
                {diagnosis.rank}
              </div>
              <p className="mt-2 font-semibold text-charcoal-900 text-base">{rankInfo.label}</p>
              <p className="text-gray-500 text-sm mt-1 text-center max-w-[240px]">{rankInfo.description}</p>
            </motion.div>
          </div>

          {diagnosis.crawl_warning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3, duration: 0.4 }}
              className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3 flex items-center gap-3 w-full max-w-sm"
            >
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} strokeWidth={1.8} color="#d97706" />
              </div>
              <p className="text-amber-700 text-xs leading-relaxed">{diagnosis.crawl_warning}</p>
            </motion.div>
          )}

          {highPriorityCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.4 }}
              className="mt-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-3 flex items-center gap-3 w-full max-w-sm"
            >
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} strokeWidth={1.8} color="#ef4444" />
              </div>
              <div>
                <p className="text-red-700 text-xs font-semibold">優先度の高い改善ポイント：{highPriorityCount}件</p>
                <p className="text-red-500 text-xs mt-0.5">「改善提案」タブで確認してください</p>
              </div>
            </motion.div>
          )}
        </section>

        {/* Tabs */}
        <div className="sticky top-[57px] z-30 bg-[#F5F8FA] border-b border-gray-100">
          <div className="flex overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 relative"
                style={{ color: activeTab === tab.id ? ACCENT : "#9ca3af" }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="aiCheckActiveTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: ACCENT }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-5 py-6">
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
              {diagnosis.summary && (
                <div className="bg-white rounded-2xl border p-5" style={CARD_STYLE}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">AIから見たあなたの美容室</p>
                  <p className="text-sm text-charcoal-800 leading-relaxed mb-3">{diagnosis.summary}</p>
                  {diagnosis.target && (
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold text-charcoal-700">想定ターゲット：</span>
                      {diagnosis.target}
                    </p>
                  )}
                </div>
              )}

              {(diagnosis.strengths.length > 0 || diagnosis.weaknesses.length > 0) && (
                <div className="bg-white rounded-2xl border p-5" style={CARD_STYLE}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">強みと弱みのサマリー</p>
                  <div className="space-y-2">
                    {diagnosis.strengths.length > 0 && (
                      <>
                        <div className="flex items-center gap-1.5 mb-2">
                          <TrendingUp size={13} strokeWidth={2} className="text-green-600" />
                          <p className="text-xs font-semibold text-green-600">AIが理解できていること</p>
                        </div>
                        {diagnosis.strengths.map((s, i) => (
                          <div key={i} className="bg-green-50 rounded-lg px-3 py-2 text-xs text-green-800 mb-1.5">{s}</div>
                        ))}
                      </>
                    )}
                    {diagnosis.weaknesses.length > 0 && (
                      <div className="pt-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Target size={13} strokeWidth={2} className="text-red-500" />
                          <p className="text-xs font-semibold text-red-500">AIが理解できていないこと</p>
                        </div>
                        {diagnosis.weaknesses.map((w, i) => (
                          <div key={i} className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-800 mb-1.5">{w}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "detail" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
              <div className="bg-white rounded-2xl border p-5" style={CARD_STYLE}>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-5">カテゴリ別スコア</p>
                <div className="space-y-4">
                  {diagnosis.category_scores.map((c, i) => {
                    const Icon = CATEGORY_ICON[c.categoryId];
                    const pct = Math.round((c.score / c.maxScore) * 100);
                    return (
                      <motion.div
                        key={c.categoryId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i, duration: 0.5 }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${ACCENT}18` }}
                            >
                              <Icon size={14} color={ACCENT} strokeWidth={1.8} />
                            </div>
                            <span className="text-sm font-semibold text-charcoal-900">{AI_CHECK_CATEGORY_LABEL[c.categoryId]}</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold" style={{ color: ACCENT }}>{c.score}</span>
                            <span className="text-xs text-gray-400">/ {c.maxScore}</span>
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: ACCENT }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.2 + 0.1 * i, duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <div className="flex justify-end mt-0.5">
                          <span className="text-xs text-gray-400">{pct}%</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border overflow-hidden" style={CARD_STYLE}>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">カテゴリ</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">スコア</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">達成率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diagnosis.category_scores.map((c, i) => {
                      const pct = Math.round((c.score / c.maxScore) * 100);
                      return (
                        <tr key={c.categoryId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-4 py-3 text-sm font-medium text-charcoal-900">{AI_CHECK_CATEGORY_LABEL[c.categoryId]}</td>
                          <td className="px-4 py-3 text-right text-sm font-bold" style={{ color: ACCENT }}>
                            {c.score} <span className="text-gray-400 font-normal text-xs">/ {c.maxScore}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-bold" style={{ color: ACCENT }}>{pct}%</span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-[#1a1a1a]">
                      <td className="px-4 py-3 text-sm font-bold text-white">合計</td>
                      <td className="px-4 py-3 text-right text-sm font-bold" style={{ color: ACCENT }}>
                        {diagnosis.total_score} <span className="text-gray-400 font-normal text-xs">/ 100</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold" style={{ color: ACCENT }}>
                        {diagnosis.total_score}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "action" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-3">
              <p className="text-gray-500 text-xs leading-relaxed mb-4">
                改善提案は{diagnosis.recommendations.length}件あります。優先度の高いものから順番に取り組みましょう。
              </p>

              {diagnosis.recommendations.map((rec, i) => {
                const priority = PRIORITY_STYLES[rec.priority];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i, duration: 0.5 }}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                  >
                    <div className="px-5 pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: ACCENT }}>
                          {rec.category}
                        </div>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${priority.bg} ${priority.text} border ${priority.border}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                          {priority.label}
                        </div>
                      </div>
                      <h3 className="text-charcoal-900 font-bold text-sm leading-snug mb-2">{rec.problem}</h3>
                      <p className="text-gray-600 text-xs leading-relaxed">{rec.reason}</p>
                    </div>
                    <div className="mx-4 mb-4 bg-[#F5F8FA] rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: ACCENT }}
                        >
                          <Check size={10} strokeWidth={2.5} color="white" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-charcoal-900 mb-0.5">今すぐできるアクション</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{rec.solution}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              <div className="bg-[#1a1a1a] rounded-3xl p-6 mt-8">
                <p className="text-white text-lg font-bold mb-2 leading-snug">
                  プロと一緒に
                  <br />
                  AI対策を進めませんか？
                </p>
                <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                  診断結果をもとに、具体的な改善アクションをご提案します。無料相談は30分から。
                </p>
                <button
                  className="w-full py-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}
                  onClick={() => window.open("https://koko-design.com/contact/", "_blank")}
                >
                  無料相談を申し込む
                  <ArrowRight size={16} strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-5 pt-3 pb-6 flex gap-2 z-40">
        <button
          onClick={handleShare}
          className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 flex items-center justify-center gap-1.5"
        >
          <Share2 size={14} strokeWidth={1.8} />
          シェア
        </button>
        <Link
          href="/ai-check"
          className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 text-white"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}
        >
          <RotateCcw size={14} strokeWidth={1.8} />
          もう一度診断する
        </Link>
      </div>
    </div>
  );
}
