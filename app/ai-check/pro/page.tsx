"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Zap,
  Sparkles,
  MapPin,
  Star,
  ListChecks,
  Globe,
  MessageCircleQuestion,
  Users,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { QUIZ_QUESTIONS } from "@/lib/ai-check/quiz-questions";
import { AI_CHECK_CATEGORY_LABEL, AiCheckCategoryId, DiagnosisItem, GoogleReviewsManualInput } from "@/lib/ai-check/types";
import { SiteDataForPrompt } from "@/lib/ai-check/build-ai-check-prompt";

const ACCENT = "#5B9BD5";
const ACCENT_DARK = "#4A82B5";
const TOTAL = QUIZ_QUESTIONS.length;

// 価値診断の詳細版(app/(diagnosis)/diagnosis/page.tsx)と同じアクセスコード方式。
// プロ版はGeminiを1回呼ぶため、価値診断の詳細版と同様スタッフ経由の配布に限定する
// （簡易版は誰でも無制限に使える想定のためゲート無し）。
const ACCESS_CODE = "KOKO2025";
const AUTH_KEY = "ai-check-pro-auth";

function AccessGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().toUpperCase() === ACCESS_CODE) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onUnlock();
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F5F8FA] flex flex-col items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}>
            <Lock size={28} strokeWidth={1.8} color="white" />
          </div>
          <p className="text-xs font-medium tracking-[0.3em] uppercase mb-2" style={{ color: ACCENT }}>Salon AI Check</p>
          <h1 className="text-charcoal-900 text-2xl font-bold text-center leading-snug">プロ診断</h1>
          <p className="text-gray-500 text-sm text-center mt-2 leading-relaxed">
            この診断はスタッフ向けです。<br />アクセスコードを入力してください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showCode ? "text" : "password"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="アクセスコードを入力"
              autoComplete="off"
              className="w-full px-5 py-4 rounded-2xl border-2 text-center text-lg font-bold tracking-widest outline-none transition-all duration-200"
              style={{
                borderColor: error ? "#ef4444" : input ? ACCENT : "#e5e7eb",
                backgroundColor: error ? "#fef2f2" : "white",
              }}
            />
            <button type="button" onClick={() => setShowCode(!showCode)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showCode ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 text-sm text-center">
                アクセスコードが違います
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!input}
            className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}
          >
            <span>入る</span>
            <ChevronRight size={18} strokeWidth={2} />
          </motion.button>
        </form>

        <p className="text-gray-400 text-xs text-center mt-6">
          一般の方は
          <a href="/ai-check" className="underline ml-1" style={{ color: ACCENT }}>基礎診断</a>
          をご利用ください
        </p>
      </motion.div>
    </div>
  );
}

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

interface CrawlDraft {
  url: string;
  ruleItems: DiagnosisItem[];
  crawlWarning: string | null;
  siteDataForPrompt: SiteDataForPrompt;
}

type Phase = "form" | "crawling" | "quiz" | "finalizing";

function LoadingOverlay({ title, subtitle }: { title: string; subtitle: string }) {
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
          {title}
          <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
            ...
          </motion.span>
        </p>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

export default function AiCheckProPage() {
  return (
    <Suspense fallback={<LoadingOverlay title="読み込み中" subtitle="" />}>
      <AiCheckProInner />
    </Suspense>
  );
}

// useSearchParams()はSuspense境界内でないとビルド時にエラーになるため、
// 中身を分離している。
function AiCheckProInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>("form");
  const [url, setUrl] = useState(() => searchParams.get("url") ?? "");
  const [hasGbp, setHasGbp] = useState<"unknown" | "yes" | "no">("unknown");
  const [reviewCount, setReviewCount] = useState("");
  const [averageRating, setAverageRating] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<CrawlDraft | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const autoStarted = useRef(false);

  useEffect(() => {
    setIsAuthorized(!!sessionStorage.getItem(AUTH_KEY));
  }, []);

  // 結果画面の「もう一度診断する」から ?url= 付きで来た場合、URL入力フォームを
  // 省略してそのままクロールへ進む（手入力の手間を省く）。
  useEffect(() => {
    if (isAuthorized !== true || autoStarted.current) return;
    const urlParam = searchParams.get("url");
    if (urlParam) {
      autoStarted.current = true;
      handleStart(undefined, urlParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthorized]);

  const handleStart = async (e?: React.FormEvent, overrideUrl?: string) => {
    e?.preventDefault();
    const targetUrl = overrideUrl ?? url;
    if (!targetUrl.trim()) return;
    setPhase("crawling");
    setError("");
    try {
      const body: Record<string, unknown> = { url: targetUrl.trim(), tier: "pro" };
      if (hasGbp !== "unknown") {
        const googleReviews: GoogleReviewsManualInput = {
          hasGoogleBusinessProfile: hasGbp === "yes",
          reviewCount: Number(reviewCount) || 0,
          averageRating: Number(averageRating) || 0,
        };
        body.googleReviews = googleReviews;
      }
      const res = await fetch("/api/ai-check/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "サイトの確認に失敗しました");
      setDraft({ url: json.url, ruleItems: json.ruleItems, crawlWarning: json.crawlWarning, siteDataForPrompt: json.siteDataForPrompt });
      setPhase("quiz");
    } catch (err) {
      setError(err instanceof Error ? err.message : "サイトの確認に失敗しました");
      setPhase("form");
    }
  };

  const handleAnswer = (score: number) => {
    setAnswers((a) => ({ ...a, [QUIZ_QUESTIONS[quizIndex].id]: score }));
  };

  const handleNext = async () => {
    const question = QUIZ_QUESTIONS[quizIndex];
    if (answers[question.id] === undefined || !draft) return;
    if (quizIndex < TOTAL - 1) {
      setQuizIndex((i) => i + 1);
      return;
    }
    setPhase("finalizing");
    try {
      const res = await fetch("/api/ai-check/diagnose/pro-finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, quizAnswers: answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "診断に失敗しました");
      router.push(`/ai-check/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "診断に失敗しました");
      setPhase("quiz");
    }
  };

  const handleBack = () => {
    if (quizIndex === 0) {
      setPhase("form");
      setDraft(null);
      setAnswers({});
    } else {
      setQuizIndex((i) => i - 1);
    }
  };

  if (isAuthorized === null) return null;
  if (!isAuthorized) return <AccessGate onUnlock={() => setIsAuthorized(true)} />;

  if (phase === "crawling") return <LoadingOverlay title="サイトを確認中" subtitle="基礎項目を自動チェックしています..." />;
  if (phase === "finalizing") return <LoadingOverlay title="AIが分析中" subtitle="回答内容をもとにコメントを作成しています..." />;

  if (phase === "quiz") {
    const question = QUIZ_QUESTIONS[quizIndex];
    const Icon = CATEGORY_ICON[question.categoryId];
    const currentAnswer = answers[question.id];
    const isLast = quizIndex === TOTAL - 1;

    return (
      <div className="min-h-[100dvh] bg-[#F5F8FA] flex flex-col">
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between sticky top-0 z-40">
          <button onClick={handleBack} className="flex items-center gap-1 text-gray-500">
            <ChevronLeft size={16} strokeWidth={1.8} />
            <span className="text-xs">戻る</span>
          </button>
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} strokeWidth={2} style={{ color: ACCENT }} />
            <p className="text-xs font-medium tracking-widest uppercase" style={{ color: ACCENT }}>プロ診断</p>
          </div>
          <span className="text-gray-400 text-xs">{quizIndex + 1} / {TOTAL}</span>
        </div>

        <div className="bg-white px-5 pb-4 pt-2">
          <div className="flex gap-1 flex-wrap">
            {QUIZ_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className="flex-1 min-w-[3px] h-1.5 rounded-full transition-all duration-300"
                style={{ backgroundColor: i < quizIndex ? ACCENT : i === quizIndex ? `${ACCENT}88` : "#e5e7eb" }}
              />
            ))}
          </div>
        </div>

        <main className="flex-1 px-5 py-6 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col flex-1"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}18` }}>
                  <Icon size={18} color={ACCENT} strokeWidth={1.8} />
                </div>
                <p className="text-charcoal-900 font-semibold text-sm">{AI_CHECK_CATEGORY_LABEL[question.categoryId]}</p>
              </div>

              <div className="bg-white rounded-2xl border p-6 mb-6" style={{ borderColor: `${ACCENT}33`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
                <h2 className="text-charcoal-900 text-lg font-bold leading-snug">{question.question}</h2>
              </div>

              <div className="space-y-2 flex-1">
                {question.options.map((option, index) => {
                  const isSelected = currentAnswer === index;
                  return (
                    <motion.button
                      key={index}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(index)}
                      className="w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3"
                      style={{
                        borderColor: isSelected ? ACCENT : "transparent",
                        backgroundColor: isSelected ? `${ACCENT}14` : "white",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all duration-200"
                        style={{ backgroundColor: isSelected ? ACCENT : "#f0f0f0", color: isSelected ? "white" : "#999" }}
                      >
                        {index}
                      </div>
                      <span className="flex-1 flex flex-col gap-0.5">
                        <span className="text-sm font-medium" style={{ color: isSelected ? ACCENT : "#444", fontWeight: isSelected ? 600 : 400 }}>
                          {option}
                        </span>
                        {question.optionDescriptions[index] && (
                          <span className="text-xs leading-snug" style={{ color: isSelected ? `${ACCENT}cc` : "#999" }}>
                            {question.optionDescriptions[index]}
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                          <CheckCircle2 size={20} strokeWidth={2} color={ACCENT} />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        <div className="px-5 pb-10 pt-4 bg-[#F5F8FA]">
          {error && <p className="text-xs text-red-500 mb-2 text-center">{error}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            disabled={currentAnswer === undefined}
            className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40"
            style={{ background: currentAnswer !== undefined ? `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` : "#ccc" }}
          >
            <span>{isLast ? "診断結果を見る" : "次へ"}</span>
            <ChevronRight size={18} strokeWidth={2} />
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-charcoal-950 flex flex-col">
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
      </div>

      <header className="relative z-10 px-6 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: ACCENT }}>
            <Sparkles size={13} color="white" strokeWidth={2} />
          </div>
          <span className="text-xs font-medium tracking-[0.3em] uppercase" style={{ color: ACCENT }}>Salon AI Check Pro</span>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <p className="text-sm font-medium tracking-[0.2em] mb-4 uppercase" style={{ color: ACCENT }}>AIによる本格診断</p>
          <h1 className="text-white text-4xl leading-tight mb-6">
            質問に答えて、
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${ACCENT} 0%, #8FC1E8 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              100点満点
            </span>
            で診断。
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-10">
            URL確認のあと、{TOTAL}問の質問に回答。
            <br />
            AIが強み・改善提案までコメントします。
          </p>

          <form onSubmit={handleStart} className="space-y-4">
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
              style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`, boxShadow: `0 8px 32px ${ACCENT}59` }}
            >
              <Zap size={18} strokeWidth={2} />
              プロ診断を始める
            </motion.button>
          </form>
          <p className="text-gray-500 text-xs text-center mt-3">所要時間：約5分 ／ 無料 ／ {TOTAL}問の質問に回答</p>
        </motion.div>
      </div>
    </main>
  );
}
