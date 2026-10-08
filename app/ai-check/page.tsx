"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  Sparkles,
  Zap,
  MapPin,
  Star,
  ListChecks,
  Globe,
  MessageCircleQuestion,
  Users,
  MessageSquareText,
  Bot,
} from "lucide-react";
import { AI_CHECK_CATEGORY_LABEL, AI_CHECK_CATEGORY_MAX, AI_CHECK_RANK_INFO, AiCheckCategoryId } from "@/lib/ai-check/types";

const LOADING_STEPS = [
  "Webサイトを確認しています...",
  "ページ構造を確認しています...",
  "店舗情報を分析しています...",
  "AI対策を分析しています...",
  "改善ポイントを作成しています...",
];

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

const CATEGORY_ORDER: AiCheckCategoryId[] = [
  "store_info", "specialty", "menu", "web_structure", "content_faq", "staff", "google_reviews", "ai_search",
];

export default function AiCheckPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [hasGbp, setHasGbp] = useState<"unknown" | "yes" | "no">("unknown");
  const [reviewCount, setReviewCount] = useState("");
  const [averageRating, setAverageRating] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    const stepTimer = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 4000);

    try {
      const body: Record<string, unknown> = { url: url.trim() };
      if (hasGbp !== "unknown") {
        body.googleReviews = {
          hasGoogleBusinessProfile: hasGbp === "yes",
          reviewCount: Number(reviewCount) || 0,
          averageRating: Number(averageRating) || 0,
        };
      }
      const res = await fetch("/api/ai-check/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "診断に失敗しました");
      router.push(`/ai-check/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "診断に失敗しました");
      setLoading(false);
      clearInterval(stepTimer);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-charcoal-950 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, #C4788A 0%, transparent 70%)" }}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <Loader2 size={32} className="animate-spin text-[#C4788A] mb-6" />
          <p className="text-white font-semibold mb-2">サイトを分析しています</p>
          <p className="text-sm text-gray-400">{LOADING_STEPS[loadingStep]}</p>
          <p className="text-xs text-gray-500 mt-6 max-w-xs">サイトの規模によっては1分以上かかることがあります</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F3] flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal-950 flex flex-col">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <motion.div
            animate={{
              x: [0, -180, 60, -140, 0],
              y: [0, 140, -100, 200, 0],
              scale: [1, 1.4, 0.75, 1.5, 1],
              opacity: [0.18, 0.32, 0.12, 0.3, 0.18],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full"
            style={{ background: "radial-gradient(circle, #C4788A 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{
              x: [0, 200, -100, 160, 0],
              y: [0, -160, 120, -200, 0],
              scale: [1, 0.65, 1.5, 0.8, 1],
              opacity: [0.16, 0.1, 0.34, 0.14, 0.16],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full"
            style={{ background: "radial-gradient(circle, #C4788A 0%, transparent 70%)" }}
          />
        </div>

        <header className="relative z-10 px-6 pt-10 pb-2">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-[#C4788A] text-xs font-medium tracking-[0.3em] uppercase">Salon AI Check</span>
          </motion.div>
        </header>

        <div className="relative z-10 px-6 pt-8 pb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
            >
              <Sparkles size={24} color="white" strokeWidth={2} />
            </div>
            <h1 className="text-white text-3xl leading-tight mb-5">
              AI検索で、
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #C4788A 0%, #DA9EAD 50%, #C4788A 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "inline-block",
                }}
              >
                選ばれる美容室
              </span>
              に。
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              ChatGPT等のAI検索は、あなたの美容室を
              <br />
              「おすすめ候補」として理解できていますか？
              <br />
              URLを入れるだけで、無料で診断します。
            </p>

            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 backdrop-blur-sm">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">美容室のホームページURL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3.5 rounded-xl bg-white text-charcoal-900 text-sm border-2 border-transparent focus:outline-none focus:border-[#C4788A]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Googleビジネスプロフィール（任意、分かる範囲でOK）
                </label>
                <div className="flex gap-2 mb-2">
                  {([
                    ["unknown", "未入力"],
                    ["yes", "登録あり"],
                    ["no", "登録なし"],
                  ] as const).map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setHasGbp(value)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        hasGbp === value
                          ? "bg-[#C4788A] text-white border-[#C4788A]"
                          : "bg-transparent text-gray-400 border-white/15 hover:border-white/30"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {hasGbp === "yes" && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={0}
                      value={reviewCount}
                      onChange={(e) => setReviewCount(e.target.value)}
                      placeholder="口コミ数"
                      className="px-3 py-2 rounded-lg bg-white text-charcoal-900 text-sm focus:outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={averageRating}
                      onChange={(e) => setAverageRating(e.target.value)}
                      placeholder="評価（例: 4.3）"
                      className="px-3 py-2 rounded-lg bg-white text-charcoal-900 text-sm focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="w-full py-4 rounded-2xl text-white font-semibold text-sm tracking-wide flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)",
                  boxShadow: "0 8px 32px rgba(196, 120, 138, 0.35)",
                }}
              >
                <Zap size={16} strokeWidth={2} />
                無料で診断する
              </motion.button>
            </form>
            <p className="text-gray-500 text-xs text-center mt-3">所要時間：約1分 ／ 無料 ／ 登録不要</p>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section className="px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <p className="text-[#C4788A] text-xs font-medium tracking-[0.3em] uppercase mb-4">About</p>
          <h2 className="text-2xl font-bold text-charcoal-900 mb-4 leading-snug">
            SEO診断とは
            <br />
            少し違います
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            単純な検索順位チェックではなく、
            <strong className="text-charcoal-900">AIがあなたの美容室を理解し、おすすめできる状態か</strong>
            を診断します。
            <br />
            <br />
            店舗情報・専門性・メニュー・サイト構造・コンテンツ・スタッフ・口コミ・AI検索対応度の
            <strong className="text-charcoal-900">8つの軸</strong>
            で、100点満点でスコアリングします。
          </p>
        </motion.div>
      </section>

      {/* 8 Categories */}
      <section className="px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8">
          <p className="text-[#C4788A] text-xs font-medium tracking-[0.3em] uppercase mb-4">8 Categories</p>
          <h2 className="text-2xl font-bold text-charcoal-900 leading-snug">診断の8つの軸</h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {CATEGORY_ORDER.map((categoryId, i) => {
            const Icon = CATEGORY_ICON[categoryId];
            return (
              <motion.div
                key={categoryId}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="card-luxury p-4"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: "#C4788A18" }}
                >
                  <Icon size={18} color="#C4788A" strokeWidth={1.8} />
                </div>
                <p className="font-semibold text-charcoal-900 text-sm mb-1">{AI_CHECK_CATEGORY_LABEL[categoryId]}</p>
                <p className="text-gray-500 text-xs">{AI_CHECK_CATEGORY_MAX[categoryId]}点満点</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Rank system */}
      <section className="px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8">
          <p className="text-[#C4788A] text-xs font-medium tracking-[0.3em] uppercase mb-4">Rank System</p>
          <h2 className="text-2xl font-bold text-charcoal-900 leading-snug">6段階のランク判定</h2>
        </motion.div>

        <div className="space-y-2">
          {(Object.values(AI_CHECK_RANK_INFO) as (typeof AI_CHECK_RANK_INFO)[keyof typeof AI_CHECK_RANK_INFO][])
            .sort((a, b) => b.minScore - a.minScore)
            .map((info, i) => (
              <motion.div
                key={info.rank}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                  style={{ background: info.color }}
                >
                  {info.rank}
                </div>
                <div>
                  <p className="font-semibold text-charcoal-900 text-sm">{info.description}</p>
                  <p className="text-gray-500 text-xs">
                    {info.maxScore === 100 ? `${info.minScore}〜100点` : `${info.minScore}〜${info.maxScore}点`}
                  </p>
                </div>
              </motion.div>
            ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-[#1a1a1a] rounded-3xl p-8 text-center"
        >
          <p className="text-white text-2xl font-bold mb-3 leading-snug">
            あなたの美容室は
            <br />
            AIに選ばれますか？
          </p>
          <p className="text-gray-400 text-sm mb-8">今すぐ無料で診断してみましょう</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-full py-5 rounded-2xl text-white font-semibold text-base tracking-wide flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)", boxShadow: "0 8px 32px rgba(196, 120, 138, 0.35)" }}
          >
            <Zap size={18} strokeWidth={2} />
            <span>診断を始める</span>
          </motion.button>
        </motion.div>
      </section>

      <footer className="px-6 py-8 border-t border-gray-200">
        <p className="text-gray-400 text-xs text-center leading-relaxed">
          本診断はAI検索順位を保証するものではありません。AIが店舗の情報を理解・評価するために
          必要と考えられる情報の充実度を、独自基準で診断したものです。
        </p>
      </footer>
    </main>
  );
}
