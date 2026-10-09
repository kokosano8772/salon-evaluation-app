"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
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
  Sparkles,
} from "lucide-react";
import { AI_CHECK_CATEGORY_LABEL, AI_CHECK_CATEGORY_MAX, AI_CHECK_RANK_INFO, AiCheckCategoryId } from "@/lib/ai-check/types";

// 美容室価値診断（薔薇色 #C4788A）と同じシリーズだが別物と分かるよう、
// 「将来性」カテゴリ（lib/scoring.ts）と同じ青系をAI Check専用のアクセントにする。
const ACCENT = "#5B9BD5";
const ACCENT_DARK = "#4A82B5";

// プロ診断はアクセスコードが必要なスタッフ向けページのため、一般公開側の導線としては
// 直接リンクせず、価値診断と同じLINE相談窓口に繋ぐ。
const LINE_URL = "https://page.line.me/470bhtcb?oat_content=url&openQrModal=true";

// サーバー関数のタイムアウト等でレスポンスがJSONでないプレーンテキストになることが
// あり、その場合res.json()が生のSyntaxErrorを投げてしまう。ユーザーに分かりやすい
// メッセージを出すため、先にtextで受けてから自前でパースする。
async function parseJsonResponse(res: Response): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const text = await res.text();
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      message: res.ok
        ? "サーバーからの応答が不正でした。もう一度お試しください"
        : "処理に時間がかかりすぎたか、サーバー側で問題が発生しました。しばらく待ってから再度お試しください",
    };
  }
}

const LineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M22 10.5C22 6.36 17.52 3 12 3S2 6.36 2 10.5c0 3.64 3.23 6.7 7.59 7.28.3.07.7.2.8.47.09.24.06.61.03.85l-.13.77c-.04.24-.18.93.82.51 1-.42 5.38-3.17 7.35-5.43 1.35-1.49 2.54-3.28 2.54-6.45z"
      fill="white"
    />
  </svg>
);

const LOADING_STEPS = [
  "Webサイトを確認しています...",
  "ページ構造を確認しています...",
  "店舗情報を分析しています...",
  "基礎項目をチェックしています...",
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
    }, 1500);

    try {
      const body: Record<string, unknown> = { url: url.trim(), tier: "simple" };
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
      const parsed = await parseJsonResponse(res);
      if (!parsed.ok) throw new Error(parsed.message);
      const json = parsed.data;
      if (!res.ok) throw new Error((json.error as string | undefined) ?? "診断に失敗しました");
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
            animate={{
              x: [0, -180, 60, -140, 0],
              y: [0, 140, -100, 200, 0],
              scale: [1, 1.4, 0.75, 1.5, 1],
              opacity: [0.18, 0.32, 0.12, 0.3, 0.18],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full"
            style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
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
            style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative flex items-center justify-center w-32 h-32 mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute w-32 h-32 rounded-full border-2 border-dashed"
              style={{ borderColor: `${ACCENT}44` }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute w-20 h-20 rounded-full border-2"
              style={{ borderColor: `${ACCENT}88` }}
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: ACCENT }}
            />
          </div>
          <p className="text-white font-semibold text-lg tracking-wider mb-3">
            分析中
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              ...
            </motion.span>
          </p>
          <p className="text-sm text-gray-400">{LOADING_STEPS[loadingStep]}</p>
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
            animate={{
              x: [0, -200, 80, -160, 0],
              y: [0, 160, -120, 220, 0],
              scale: [1, 1.5, 0.75, 1.6, 1],
              opacity: [0.18, 0.35, 0.12, 0.32, 0.18],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full"
            style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
          />
          <motion.div
            animate={{
              x: [0, 220, -120, 180, 0],
              y: [0, -180, 140, -220, 0],
              scale: [1, 0.65, 1.55, 0.8, 1],
              opacity: [0.18, 0.12, 0.38, 0.15, 0.18],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full"
            style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
          />
          <motion.div
            animate={{
              x: [0, 240, -180, 160, -200, 0],
              y: [0, -160, 200, -180, 120, 0],
              scale: [0.7, 1.4, 0.85, 1.5, 0.7],
              opacity: [0.06, 0.14, 0.07, 0.16, 0.06],
            }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
            style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 60%)` }}
          />
        </div>

        <header className="relative z-10 px-6 pt-12 pb-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: ACCENT }}>
                <Bot size={13} color="white" strokeWidth={2} />
              </div>
              <span className="text-xs font-medium tracking-[0.3em] uppercase" style={{ color: ACCENT }}>
                Salon AI Check
              </span>
            </div>
          </motion.div>
        </header>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <p className="text-sm font-medium tracking-[0.2em] mb-4 uppercase" style={{ color: ACCENT }}>
              無料・基礎診断
            </p>
            <h1 className="text-white text-4xl leading-tight mb-6">
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
              サイトの基礎項目を無料で自動チェック。
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-4 rounded-xl bg-white text-charcoal-900 text-sm border-2 border-transparent focus:outline-none"
                onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
              />

              <div>
                <p className="text-xs text-gray-500 mb-2">Googleの情報も入力する（任意）</p>
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
                className="w-full py-5 rounded-2xl text-white font-semibold text-base tracking-wide flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`,
                  boxShadow: `0 8px 32px ${ACCENT}59`,
                }}
              >
                <Zap size={18} strokeWidth={2} />
                無料で診断する
              </motion.button>
            </form>
            <p className="text-gray-500 text-xs text-center mt-3">所要時間：約30秒 ／ 無料 ／ 登録不要 ／ AI不使用</p>
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

      {/* 簡易 / プロ の違い */}
      <section className="px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <p className="text-xs font-medium tracking-[0.3em] uppercase mb-4" style={{ color: ACCENT }}>About</p>
          <h2 className="text-2xl font-bold text-charcoal-900 mb-4 leading-snug">
            このページでできること、
            <br />
            できないこと
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            このページ（基礎診断）は、サイトの構造など
            <strong className="text-charcoal-900">自動で機械的に判定できる項目のみ</strong>
            をチェックします。AIは使わないので無料・無制限・結果は数十秒で出ます。
          </p>

          <div className="bg-white rounded-2xl border p-5 mb-3" style={{ borderColor: `${ACCENT}33`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <p className="font-semibold text-charcoal-900 text-sm mb-1">基礎診断（このページ）</p>
            <p className="text-gray-500 text-xs leading-relaxed">URL入力だけ・AI不使用・無料無制限。サイト構造など機械的に判定できる項目のみチェック。</p>
          </div>

          <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={14} style={{ color: ACCENT }} />
              <p className="font-semibold text-sm">プロ診断</p>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed mb-4">
              質問に答えることで、専門性・強み・口コミなどAIでしか判定できない項目まで含めた100点満点のフル診断に。AIが「あなたの美容室から見た強み・改善提案」まで作成します。
            </p>
            <a
              href={LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: "#06C755" }}
            >
              <LineIcon />
              LINEでプロ診断について相談する
            </a>
          </div>
        </motion.div>
      </section>

      {/* 8 Categories */}
      <section className="px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8">
          <p className="text-xs font-medium tracking-[0.3em] uppercase mb-4" style={{ color: ACCENT }}>8 Categories</p>
          <h2 className="text-2xl font-bold text-charcoal-900 leading-snug">診断の8つの軸</h2>
          <p className="text-gray-500 text-xs mt-2">※各軸の満点まで診断するにはプロ診断が必要です</p>
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
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-4 border"
                style={{ borderColor: `${ACCENT}33`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${ACCENT}18` }}
                >
                  <Icon size={20} color={ACCENT} strokeWidth={1.8} />
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
          <p className="text-xs font-medium tracking-[0.3em] uppercase mb-4" style={{ color: ACCENT }}>Rank System</p>
          <h2 className="text-2xl font-bold text-charcoal-900 leading-snug">プロ診断の6段階ランク</h2>
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
                transition={{ duration: 0.4, delay: i * 0.08 }}
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

      <footer className="px-6 py-8 border-t border-gray-200">
        <p className="text-gray-400 text-xs text-center leading-relaxed">
          本診断はAI検索順位を保証するものではありません。AIが店舗の情報を理解・評価するために
          必要と考えられる情報の充実度を、独自基準で診断したものです。
        </p>
      </footer>
    </main>
  );
}
