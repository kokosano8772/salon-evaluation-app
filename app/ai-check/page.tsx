"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  Bot,
  Zap,
  MapPin,
  Star,
  ListChecks,
  Globe,
  MessageCircleQuestion,
  Users,
  MessageSquareText,
  ArrowDown,
} from "lucide-react";
import { AI_CHECK_CATEGORY_LABEL, AI_CHECK_CATEGORY_MAX, AI_CHECK_RANK_INFO, AiCheckCategoryId } from "@/lib/ai-check/types";

// 美容室価値診断（薔薇色 #C4788A）と同じシリーズだが別物と分かるよう、
// 「将来性」カテゴリ（lib/scoring.ts）と同じ青系をAI Check専用のアクセントにする。
const ACCENT = "#5B9BD5";
const ACCENT_DARK = "#4A82B5";

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
            style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <Loader2 size={32} className="animate-spin mb-6" style={{ color: ACCENT }} />
          <p className="text-white font-semibold mb-2">サイトを分析しています</p>
          <p className="text-sm text-gray-400">{LOADING_STEPS[loadingStep]}</p>
          <p className="text-xs text-gray-500 mt-6 max-w-xs">サイトの規模によっては1分以上かかることがあります</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F8FA] flex flex-col">
      {/* Hero（価値診断と同じく、最初の1画面分で完結させる） */}
      <section className="relative overflow-hidden bg-charcoal-950 min-h-[100dvh] flex flex-col">
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.14, 0.24, 0.14] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full"
            style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
          />
          <motion.div
            animate={{ scale: [1, 0.8, 1], opacity: [0.1, 0.18, 0.1] }}
            transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-32 -left-24 w-[420px] h-[420px] rounded-full"
            style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
          />
        </div>

        <header className="relative z-10 px-6 pt-12 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: ACCENT }}>
              <Bot size={15} color="white" strokeWidth={2} />
            </div>
            <span className="text-xs font-medium tracking-[0.25em] uppercase" style={{ color: ACCENT }}>
              Salon AI Check
            </span>
          </div>
        </header>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h1 className="text-white text-3xl leading-tight mb-5 font-bold">
              AI検索に、
              <br />
              <span
                style={{
                  background: `linear-gradient(135deg, ${ACCENT} 0%, #8FC1E8 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                選ばれる美容室
              </span>
              に。
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-10">
              URLを入れるだけで、
              <br />
              AI検索対策の充実度を無料診断。
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3.5 rounded-xl bg-white text-charcoal-900 text-sm border-2 border-transparent focus:outline-none"
                onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
              />

              <div>
                <p className="text-[11px] text-gray-500 mb-2">Googleの情報も入力する（任意）</p>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex gap-2">
                    {([
                      ["unknown", "未入力"],
                      ["yes", "登録あり"],
                      ["no", "登録なし"],
                    ] as const).map(([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => setHasGbp(value)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium border transition-colors"
                        style={
                          hasGbp === value
                            ? { background: ACCENT, borderColor: ACCENT, color: "white" }
                            : { background: "transparent", borderColor: "rgba(255,255,255,0.15)", color: "#9ca3af" }
                        }
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
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                className="w-full py-4 rounded-xl text-white font-semibold text-sm tracking-wide flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`,
                  boxShadow: `0 8px 24px ${ACCENT}40`,
                }}
              >
                <Zap size={16} strokeWidth={2} />
                無料で診断する
              </motion.button>
            </form>
            <p className="text-gray-500 text-xs text-center mt-4">所要時間：約1分 ／ 無料 ／ 登録不要</p>
          </motion.div>
        </div>

        <motion.div
          className="relative z-10 flex justify-center pb-8"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex flex-col items-center gap-1 opacity-40">
            <span className="text-white text-[10px] tracking-widest">SCROLL</span>
            <ArrowDown size={16} strokeWidth={1.5} color="white" />
          </div>
        </motion.div>
      </section>

      {/* About */}
      <section className="px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="text-xs font-medium tracking-[0.25em] uppercase mb-3" style={{ color: ACCENT }}>About</p>
          <h2 className="text-xl font-bold text-charcoal-900 mb-3 leading-snug">SEO診断とは少し違います</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            単純な検索順位チェックではなく、<strong className="text-charcoal-900">AIがあなたの美容室を理解し、おすすめできる状態か</strong>を、
            8つの軸・100点満点でスコアリングします。
          </p>
        </motion.div>
      </section>

      {/* 8 Categories */}
      <section className="px-6 pb-10">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-5">
          <h2 className="text-xl font-bold text-charcoal-900 leading-snug">診断の8つの軸</h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-2.5">
          {CATEGORY_ORDER.map((categoryId, i) => {
            const Icon = CATEGORY_ICON[categoryId];
            return (
              <motion.div
                key={categoryId}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="bg-white rounded-xl p-3.5 border border-gray-100"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
                  style={{ backgroundColor: `${ACCENT}18` }}
                >
                  <Icon size={15} color={ACCENT} strokeWidth={1.8} />
                </div>
                <p className="font-semibold text-charcoal-900 text-xs mb-0.5">{AI_CHECK_CATEGORY_LABEL[categoryId]}</p>
                <p className="text-gray-400 text-[11px]">{AI_CHECK_CATEGORY_MAX[categoryId]}点満点</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Rank system */}
      <section className="px-6 pb-10">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mb-5">
          <h2 className="text-xl font-bold text-charcoal-900 leading-snug">6段階のランク判定</h2>
        </motion.div>

        <div className="space-y-1.5">
          {(Object.values(AI_CHECK_RANK_INFO) as (typeof AI_CHECK_RANK_INFO)[keyof typeof AI_CHECK_RANK_INFO][])
            .sort((a, b) => b.minScore - a.minScore)
            .map((info, i) => (
              <motion.div
                key={info.rank}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: info.color }}
                >
                  {info.rank}
                </div>
                <div>
                  <p className="font-semibold text-charcoal-900 text-xs">{info.description}</p>
                  <p className="text-gray-400 text-[11px]">
                    {info.maxScore === 100 ? `${info.minScore}〜100点` : `${info.minScore}〜${info.maxScore}点`}
                  </p>
                </div>
              </motion.div>
            ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-[#1a1a1a] rounded-2xl p-6 text-center"
        >
          <p className="text-white text-lg font-bold mb-1 leading-snug">あなたの美容室はAIに選ばれますか？</p>
          <p className="text-gray-400 text-xs mb-5">今すぐ無料で診断してみましょう</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm tracking-wide flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}
          >
            <Zap size={15} strokeWidth={2} />
            <span>診断を始める</span>
          </motion.button>
        </motion.div>
      </section>

      <footer className="px-6 py-6 border-t border-gray-200">
        <p className="text-gray-400 text-[11px] text-center leading-relaxed">
          本診断はAI検索順位を保証するものではありません。AIが店舗の情報を理解・評価するために
          必要と考えられる情報の充実度を、独自基準で診断したものです。
        </p>
      </footer>
    </main>
  );
}
