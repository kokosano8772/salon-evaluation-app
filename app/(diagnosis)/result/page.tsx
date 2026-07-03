"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Target,
  Share2,
  ArrowRight,
  Download,
} from "lucide-react";
import { exportResultToPDF } from "@/lib/pdf";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { RANK_INFO } from "@/lib/scoring";
import { generateImprovements } from "@/lib/recommendations";
import ScoreCounter from "@/components/result/ScoreCounter";
import CategoryScoreBar from "@/components/result/CategoryScoreBar";
import ImprovementCard from "@/components/result/ImprovementCard";
import dynamic from "next/dynamic";

const SalonRadarChart = dynamic(
  () => import("@/components/result/SalonRadarChart"),
  { ssr: false }
);

/* LINE brand icon — kept as inline SVG since Lucide doesn't include it */
const LineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M22 10.5C22 6.36 17.52 3 12 3S2 6.36 2 10.5c0 3.64 3.23 6.7 7.59 7.28.3.07.7.2.8.47.09.24.06.61.03.85l-.13.77c-.04.24-.18.93.82.51 1-.42 5.38-3.17 7.35-5.43 1.35-1.49 2.54-3.28 2.54-6.45z"
      fill="white"
    />
  </svg>
);

export default function ResultPage() {
  const router = useRouter();
  const { result, reset } = useDiagnosisStore();
  const [activeTab, setActiveTab] = useState<"overview" | "detail" | "action">("overview");
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result) router.replace("/diagnosis");
  }, [result, router]);

  if (!result) return null;

  const rankInfo = RANK_INFO[result.rank];
  const improvements = generateImprovements(result.categoryScores);
  const highPriorityCount = improvements.filter((i) => i.priority === "high").length;

  const handleRetake = () => {
    reset();
    router.push("/diagnosis");
  };

  const handleLineShare = () => {
    window.open("https://page.line.me/470bhtcb?oat_content=url&openQrModal=true", "_blank");
  };

  const handlePdf = async () => {
    if (!resultRef.current || isPdfLoading) return;
    setIsPdfLoading(true);
    try {
      await exportResultToPDF(resultRef.current, result);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleShare = async () => {
    const text = `美容室価値診断で${result.totalScore}点（${rankInfo.label}）でした！`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Salon Value Score 診断結果", text, url: window.location.origin });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.origin}`);
      alert("URLをコピーしました");
    }
  };

  const TABS = [
    { id: "overview", label: "サマリー" },
    { id: "detail", label: "詳細スコア" },
    { id: "action", label: `改善提案 (${improvements.length})` },
  ] as const;

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F3] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={16} strokeWidth={1.8} />
          <span className="text-xs">ホーム</span>
        </Link>
        <p className="text-xs font-medium text-[#C4788A] tracking-widest uppercase">
          診断結果
        </p>
        <button
          onClick={handleRetake}
          className="flex items-center gap-1 text-gray-400 text-xs"
        >
          <RotateCcw size={12} strokeWidth={1.8} />
          再診断
        </button>
      </div>

      <main ref={resultRef} className="flex-1 pb-44">
        {/* Score Hero */}
        <section
          className="px-5 pt-10 pb-8 flex flex-col items-center relative overflow-hidden"
          style={{ background: "linear-gradient(180deg, white 0%, #FAF8F3 100%)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-2 text-center"
          >
            <p className="text-[#C4788A] text-xs font-medium tracking-[0.3em] uppercase mb-1">
              Salon Value Score
            </p>
            <p className="text-gray-500 text-xs">
              {new Date(result.completedAt).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </motion.div>

          <ScoreCounter score={result.totalScore} rank={result.rank} rankInfo={rankInfo} />

          {highPriorityCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, duration: 0.4 }}
              className="mt-6 bg-red-50 border border-red-100 rounded-2xl px-5 py-3 flex items-center gap-3 w-full max-w-sm"
            >
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={16} strokeWidth={1.8} color="#ef4444" />
              </div>
              <div>
                <p className="text-red-700 text-xs font-semibold">
                  高優先度の改善ポイント：{highPriorityCount}件
                </p>
                <p className="text-red-500 text-xs mt-0.5">
                  「改善提案」タブで確認してください
                </p>
              </div>
            </motion.div>
          )}
        </section>

        {/* Tabs */}
        <div className="sticky top-[57px] z-30 bg-[#FAF8F3] border-b border-gray-100">
          <div className="flex overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 relative ${
                  activeTab === tab.id ? "text-[#C4788A]" : "text-gray-400"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C4788A]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-5 py-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="card-luxury p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">
                  レーダーチャート
                </p>
                <SalonRadarChart categoryScores={result.categoryScores} />
              </div>

              <div className="card-luxury p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">
                  強みと弱みのサマリー
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp size={13} strokeWidth={2} className="text-green-600" />
                    <p className="text-xs font-semibold text-green-600">強み（上位）</p>
                  </div>
                  {[...result.categoryScores]
                    .sort((a, b) => b.percentage - a.percentage)
                    .slice(0, 2)
                    .map((cs) => (
                      <div
                        key={cs.categoryId}
                        className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-green-800 font-medium">{cs.name}</span>
                        <span className="text-sm font-bold" style={{ color: cs.color }}>
                          {cs.percentage}%
                        </span>
                      </div>
                    ))}

                  <div className="pt-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Target size={13} strokeWidth={2} className="text-red-500" />
                      <p className="text-xs font-semibold text-red-500">重点改善エリア（下位）</p>
                    </div>
                    {[...result.categoryScores]
                      .sort((a, b) => a.percentage - b.percentage)
                      .slice(0, 2)
                      .map((cs) => (
                        <div
                          key={cs.categoryId}
                          className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2 mb-1.5"
                        >
                          <span className="text-sm text-red-800 font-medium">{cs.name}</span>
                          <span className="text-sm font-bold" style={{ color: cs.color }}>
                            {cs.percentage}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Detail Tab */}
          {activeTab === "detail" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="card-luxury p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-5">
                  カテゴリ別スコア
                </p>
                <CategoryScoreBar categoryScores={result.categoryScores} />
              </div>

              <div className="card-luxury overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">カテゴリ</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">スコア</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">達成率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.categoryScores.map((cs, i) => (
                      <tr key={cs.categoryId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="px-4 py-3 text-sm font-medium text-charcoal-900">{cs.name}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold" style={{ color: cs.color }}>
                          {cs.score}{" "}
                          <span className="text-gray-400 font-normal text-xs">/ {cs.maxScore}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold" style={{ color: cs.color }}>
                            {cs.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#1a1a1a]">
                      <td className="px-4 py-3 text-sm font-bold text-white">合計</td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-[#C4788A]">
                        {result.totalScore}{" "}
                        <span className="text-gray-400 font-normal text-xs">/ 100</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-[#C4788A]">
                        {result.totalScore}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Action Tab */}
          {activeTab === "action" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <p className="text-gray-500 text-xs leading-relaxed mb-4">
                スコアに基づいた、今すぐ取り組める改善提案です。優先度の高いものから順番に実施しましょう。
              </p>
              {improvements.map((imp, i) => (
                <ImprovementCard key={i} improvement={imp} index={i} />
              ))}

              <div className="bg-[#1a1a1a] rounded-3xl p-6 mt-8">
                <p
                  className="text-white text-lg font-bold mb-2 leading-snug"
                >
                  プロと一緒に
                  <br />
                  改善を加速させませんか？
                </p>
                <p className="text-gray-400 text-xs mb-5 leading-relaxed">
                  診断結果をもとに、経営コンサルタントが具体的なアクションプランをご提案します。無料相談は30分から。
                </p>
                <button
                  className="w-full py-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-5 pt-3 pb-6 flex flex-col gap-2 z-40">
        <button
          onClick={handleLineShare}
          className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{ backgroundColor: "#06C755", color: "white" }}
        >
          <LineIcon />
          LINEで相談・共有
        </button>
        <div className="flex gap-2">
          <button
            onClick={handlePdf}
            disabled={isPdfLoading}
            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Download size={14} strokeWidth={2} />
            {isPdfLoading ? "生成中..." : "PDF保存"}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 flex items-center justify-center gap-1.5"
          >
            <Share2 size={14} strokeWidth={1.8} />
            シェア
          </button>
        </div>
      </div>
    </div>
  );
}
