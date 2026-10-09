"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Target,
  Share2,
  ArrowRight,
  Check,
  Download,
  Sparkles,
  Lock,
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
  AiCheckTier,
  DiagnosisItemStatus,
} from "@/lib/ai-check/types";
import AiCheckPrintDocument from "@/components/ai-check/AiCheckPrintDocument";
import { AI_JUDGED_ITEMS } from "@/lib/ai-check/build-ai-check-prompt";
import { QUIZ_QUESTIONS } from "@/lib/ai-check/quiz-questions";

// 美容室価値診断と同じシリーズとして、結果画面の「見せ方」（ヘッダー/スコアヒーロー/
// タブ構成/下部アクションバー）はapp/(diagnosis)/result/page.tsxに合わせている。
// アクセントカラーのみ青系（#5B9BD5）でAI Check専用に差別化。
const ACCENT = "#5B9BD5";
const ACCENT_DARK = "#4A82B5";

const LOADING_STEPS = [
  "Webサイトを確認しています...",
  "ページ構造を確認しています...",
  "店舗情報を分析しています...",
  "基礎項目をチェックしています...",
];

// プロ診断はアクセスコードが必要なスタッフ向けページのため、一般公開側の導線としては
// 直接リンクせず、価値診断と同じLINE相談窓口に繋ぐ（既存のapp/(diagnosis)/quick/result
// 等と同じURL）。
const LINE_URL = "https://page.line.me/470bhtcb?oat_content=url&openQrModal=true";

const LineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M22 10.5C22 6.36 17.52 3 12 3S2 6.36 2 10.5c0 3.64 3.23 6.7 7.59 7.28.3.07.7.2.8.47.09.24.06.61.03.85l-.13.77c-.04.24-.18.93.82.51 1-.42 5.38-3.17 7.35-5.43 1.35-1.49 2.54-3.28 2.54-6.45z"
      fill="white"
    />
  </svg>
);

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

const STATUS_LABEL: Record<DiagnosisItemStatus, { label: string; color: string; bg: string }> = {
  pass: { label: "OK", color: "#16a34a", bg: "bg-green-50" },
  partial: { label: "一部OK", color: "#d97706", bg: "bg-amber-50" },
  fail: { label: "未対応", color: "#dc2626", bg: "bg-red-50" },
  unknown: { label: "未確認", color: "#9ca3af", bg: "bg-gray-50" },
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

interface SearchCheckResult {
  query: string;
  mentioned: boolean;
  excerpt: string;
}

interface DiagnosisRecord {
  id: string;
  url: string;
  tier: AiCheckTier;
  total_score: number;
  score_max: number;
  rank: AiCheckRank | null;
  summary: string;
  target: string;
  strengths: string[];
  weaknesses: string[];
  missing_information: string[];
  recommendations: AiCheckRecommendation[];
  category_scores: CategoryScoreRow[];
  diagnosis_items: DiagnosisItemRow[];
  manual_answers: Record<string, number>;
  salon_name: string;
  suggested_queries: string[];
  search_check_results: SearchCheckResult[];
  search_check_run_at: string | null;
  crawl_warning: string | null;
  created_at: string;
}

const PRIORITY_STYLES: Record<AiCheckRecommendation["priority"], { label: string; bg: string; text: string; border: string; dot: string }> = {
  high: { label: "優先度：高", bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-400" },
  medium: { label: "優先度：中", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", dot: "bg-amber-400" },
  low: { label: "優先度：低", bg: "bg-green-50", text: "text-green-600", border: "border-green-200", dot: "bg-green-400" },
};

const CARD_STYLE: React.CSSProperties = { borderColor: `${ACCENT}33`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" };

// サーバー関数のタイムアウト等でレスポンスがJSONでないプレーンテキスト（例:
// Vercelの"An error occurred with your deployment"等）になることがあり、その場合
// res.json()が生のSyntaxError（"Unexpected token 'A'..."のような分かりにくい文言）を
// 投げてしまう。ユーザーに分かりやすいメッセージを出すため、先にtextで受けてから
// 自前でパースする。
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

export default function AiCheckResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [diagnosis, setDiagnosis] = useState<DiagnosisRecord | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "detail" | "action">("overview");
  const [displayScore, setDisplayScore] = useState(0);
  const [isRetaking, setIsRetaking] = useState(false);
  const [retakeStep, setRetakeStep] = useState(0);
  const [isSearchChecking, setIsSearchChecking] = useState(false);
  const [searchCheckError, setSearchCheckError] = useState("");
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fetch(`/api/ai-check/diagnose/${id}`)
      .then(async (res) => {
        const parsed = await parseJsonResponse(res);
        if (!parsed.ok) throw new Error(parsed.message);
        const json = parsed.data;
        if (!res.ok) throw new Error((json.error as string | undefined) ?? "取得に失敗しました");
        setDiagnosis(json.diagnosis as DiagnosisRecord);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "取得に失敗しました"));
  }, [id]);

  useEffect(() => {
    if (!diagnosis) return;
    // 簡易版は39点満点のような半端な分母を前面に出さず、円の中心には常に
    // 「100に対する割合」を表示する（プロ版は元々100点満点なのでそのまま）。
    const displayTarget =
      diagnosis.tier === "simple"
        ? Math.round((diagnosis.total_score / diagnosis.score_max) * 100)
        : diagnosis.total_score;
    const duration = 1800;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(displayTarget * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // スコア自体が変わった時だけ再アニメーションする。AI検索実測の結果更新など、
    // スコアに関係ない理由でdiagnosisオブジェクトが更新された時に円グラフが
    // 0から再アニメーションし直すのを防ぐため、diagnosis自体ではなく
    // スコアに関係するフィールドだけを依存配列にする。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnosis?.total_score, diagnosis?.score_max, diagnosis?.tier]);

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

  const isPro = diagnosis.tier === "pro";
  const rankInfo = diagnosis.rank ? AI_CHECK_RANK_INFO[diagnosis.rank] : null;
  const highPriorityCount = diagnosis.recommendations.filter((r) => r.priority === "high").length;
  const circumference = 2 * Math.PI * 52;
  // displayScoreはプロ版なら素点(/100)、簡易版なら割合(%)で、どちらも0〜100の
  // レンジに揃えてあるため、リングの充填率は常にdisplayScore/100でよい。
  const strokeDashoffset = circumference * (1 - displayScore / 100);

  const handleShare = async () => {
    const scoreText = isPro
      ? `${diagnosis.total_score}点（${rankInfo?.label}）`
      : `${Math.round((diagnosis.total_score / diagnosis.score_max) * 100)}%`;
    const text = `Salon AI Checkで${scoreText}でした！`;
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

  // PDF保存はブラウザのネイティブ印刷（window.print）を使う。以前はDOMをまるごと
  // スクリーンショットしA4の高さ毎に機械的に切っていたため、内容量次第でページ数が
  // 不可解に増減し「画面を撮っているだけ」の見た目になっていた。ad-report-pageクラス
  // （広告レポート・成長DBの診断レポートと同じ仕組み、globals.css参照）で明示した
  // 固定ページ単位をそのまま印刷させることで、ページ数を内容設計側で決定的に制御する。
  const handlePdf = () => {
    const originalTitle = document.title;
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    document.title = `AICheck_${diagnosis.total_score}pt_${diagnosis.rank ?? "simple"}_${date}`;

    const pages = Array.from(document.querySelectorAll<HTMLElement>(".ad-report-page"));
    const maxHeight = Math.max(0, ...pages.map((el) => el.offsetHeight));
    let printSizeStyle: HTMLStyleElement | null = null;
    const heightOverrides: { el: HTMLElement; original: string }[] = [];
    if (maxHeight > 0) {
      pages.forEach((el) => {
        if (el.offsetHeight < maxHeight) {
          heightOverrides.push({ el, original: el.style.minHeight });
          el.style.minHeight = `${maxHeight}px`;
        }
      });
      const printHeight = maxHeight + 3;
      printSizeStyle = document.createElement("style");
      printSizeStyle.textContent = `@media print { @page { size: 900px ${printHeight}px; margin: 0; } }`;
      document.head.appendChild(printSizeStyle);
    }

    const restore = () => {
      document.title = originalTitle;
      printSizeStyle?.remove();
      heightOverrides.forEach(({ el, original }) => {
        el.style.minHeight = original;
      });
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  // AI検索実測（プロ版のオプトイン機能）。確定診断とは別にGeminiを質問数ぶん呼ぶため、
  // 自動実行はせずボタン押下でのみ実行する。
  const handleSearchCheck = async () => {
    if (isSearchChecking) return;
    setIsSearchChecking(true);
    setSearchCheckError("");
    try {
      const res = await fetch(`/api/ai-check/diagnose/${id}/search-check`, { method: "POST" });
      const parsed = await parseJsonResponse(res);
      if (!parsed.ok) throw new Error(parsed.message);
      const json = parsed.data;
      if (!res.ok) throw new Error((json.error as string | undefined) ?? "実測に失敗しました");
      setDiagnosis((d) =>
        d ? { ...d, search_check_results: json.results as SearchCheckResult[], search_check_run_at: new Date().toISOString() } : d
      );
    } catch (err) {
      setSearchCheckError(err instanceof Error ? err.message : "実測に失敗しました");
    } finally {
      setIsSearchChecking(false);
    }
  };

  // 簡易版はURLを入れ直す手間を省き、その場で同じURLを再診断する。
  // プロ版はクイズの再回答が必須なため、URLを引き継いだ状態で/ai-check/proに
  // 遷移し、フォーム入力を省いてそのままクロールへ進めるようにする。
  const handleRetake = async () => {
    if (isRetaking) return;
    setIsRetaking(true);
    setRetakeStep(0);
    const stepTimer = setInterval(() => {
      setRetakeStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 1500);
    try {
      const res = await fetch("/api/ai-check/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: diagnosis.url, tier: "simple" }),
      });
      const parsed = await parseJsonResponse(res);
      if (!parsed.ok) throw new Error(parsed.message);
      const json = parsed.data;
      if (!res.ok) throw new Error((json.error as string | undefined) ?? "診断に失敗しました");
      router.push(`/ai-check/${json.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "診断に失敗しました");
      setIsRetaking(false);
    } finally {
      clearInterval(stepTimer);
    }
  };

  const TABS = [
    { id: "overview", label: "サマリー" },
    { id: "detail", label: "詳細スコア" },
    ...(isPro ? [{ id: "action" as const, label: `改善提案 (${diagnosis.recommendations.length})` }] : []),
  ] as const;

  if (isRetaking) {
    return (
      <div className="min-h-[100dvh] bg-charcoal-950 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
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
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
              ...
            </motion.span>
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={retakeStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-sm text-gray-400"
            >
              {LOADING_STEPS[retakeStep]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F5F8FA] flex flex-col">
      {/* 通常の閲覧UI。印刷（PDF保存）時はad-report-print-hideで非表示にし、
          代わりにprint-only-block（AiCheckPrintDocument）だけを表示する */}
      <div className="ad-report-print-hide flex flex-col flex-1">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link href="/ai-check" className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={16} strokeWidth={1.8} />
          <span className="text-xs">トップ</span>
        </Link>
        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: ACCENT }}>
          {isPro ? "PRO診断結果" : "AI CHECK結果"}
        </p>
        <Link href="/ai-check" className="flex items-center gap-1 text-gray-400 text-xs">
          <RotateCcw size={12} strokeWidth={1.8} />
          再診断
        </Link>
      </div>

      <main className="flex-1 pb-40">
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
              Salon AI Check{isPro ? " Pro" : "（基礎診断）"}
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
                  {!isPro && <span className="text-2xl align-top">%</span>}
                </motion.span>
                <span className="text-gray-400 text-sm mt-0.5">
                  {isPro ? `/ ${diagnosis.score_max}点` : `基礎項目 ${diagnosis.total_score}/${diagnosis.score_max}点`}
                </span>
              </div>
            </div>

            {isPro && rankInfo ? (
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
            ) : (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="mt-5 text-gray-500 text-xs text-center max-w-[260px] leading-relaxed"
              >
                これは機械的に判定できる項目のみの基礎スコアです。ランク判定はプロ診断（100点満点）で表示されます。
              </motion.p>
            )}
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

          {isPro && highPriorityCount > 0 && (
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
              {isPro ? (
                <>
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

                  {diagnosis.suggested_queries.length > 0 && (
                    <div className="bg-white rounded-2xl border p-5" style={CARD_STYLE}>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">AI検索実測</p>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">
                        実際にAIへ質問を投げて、{diagnosis.salon_name || "この美容室"}が回答に含まれるかを確かめます。
                      </p>

                      {diagnosis.search_check_results.length === 0 ? (
                        <>
                          <div className="space-y-1.5 mb-4">
                            {diagnosis.suggested_queries.map((q, i) => (
                              <p key={i} className="text-xs text-gray-400">「{q}」</p>
                            ))}
                          </div>
                          {searchCheckError && <p className="text-xs text-red-500 mb-2">{searchCheckError}</p>}
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSearchCheck}
                            disabled={isSearchChecking}
                            className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}
                          >
                            {isSearchChecking ? "AIに質問中..." : "AI検索を実測する"}
                          </motion.button>
                        </>
                      ) : (
                        <>
                          <div className="space-y-3">
                            {diagnosis.search_check_results.map((r, i) => (
                              <div key={i} className="rounded-xl border border-gray-100 p-3">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <p className="text-xs font-medium text-charcoal-800 flex-1">「{r.query}」</p>
                                  <span
                                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                                    style={r.mentioned ? { color: "#16a34a", backgroundColor: "#f0fdf4" } : { color: "#9ca3af", backgroundColor: "#f9fafb" }}
                                  >
                                    {r.mentioned ? "含まれていた" : "含まれていなかった"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400 leading-relaxed">{r.excerpt}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-3">
                            ※これは実施時点でのAIの回答1回分であり、常に同じ結果になるとは限りません。検索順位を保証するものではありません。
                          </p>
                          {searchCheckError && <p className="text-xs text-red-500 mt-2">{searchCheckError}</p>}
                          <button
                            onClick={handleSearchCheck}
                            disabled={isSearchChecking}
                            className="w-full py-2.5 rounded-xl font-semibold text-xs mt-3 bg-gray-100 text-gray-600 disabled:opacity-50"
                          >
                            {isSearchChecking ? "AIに質問中..." : "もう一度実測する"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-white rounded-2xl border p-5" style={CARD_STYLE}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">チェック項目の内訳</p>
                      <span className="text-[11px] text-gray-400">{diagnosis.diagnosis_items.length}項目チェック済み／他{QUIZ_QUESTIONS.length + AI_JUDGED_ITEMS.length}項目</span>
                    </div>
                    <div className="space-y-2">
                      {diagnosis.diagnosis_items.map((it) => {
                        const s = STATUS_LABEL[it.status];
                        return (
                          <div key={it.id} className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${s.bg}`}>
                            <span className="text-xs text-charcoal-800 flex-1">{it.label}</span>
                            <span className="text-xs font-semibold flex-shrink-0" style={{ color: s.color }}>{s.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-2 mt-5">
                      {(Object.keys(AI_CHECK_CATEGORY_LABEL) as AiCheckCategoryId[]).map((categoryId) => {
                        const count =
                          QUIZ_QUESTIONS.filter((q) => q.categoryId === categoryId).length +
                          AI_JUDGED_ITEMS.filter((d) => d.categoryId === categoryId).length;
                        if (count === 0) return null;
                        return (
                          <div key={categoryId} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 bg-gray-50">
                            <span className="text-xs text-gray-400 flex-1">{AI_CHECK_CATEGORY_LABEL[categoryId]}（残り{count}項目）</span>
                            <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400 flex-shrink-0">
                              <Lock size={10} strokeWidth={2} />
                              プロ版
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles size={14} style={{ color: ACCENT }} />
                      <p className="font-semibold text-sm">さらに詳しく知りたい方へ</p>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed mb-4">
                      専門性・口コミなど機械判定できない項目まで含めた100点満点のプロ診断なら、AIがあなたの美容室の強み・改善提案までコメントします。
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
                </>
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
                        {diagnosis.total_score} <span className="text-gray-400 font-normal text-xs">/ {diagnosis.score_max}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold" style={{ color: ACCENT }}>
                        {Math.round((diagnosis.total_score / diagnosis.score_max) * 100)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {isPro && activeTab === "action" && (
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-5 pt-3 pb-6 flex flex-col gap-2 z-40">
        {isPro ? (
          <Link
            href={`/ai-check/pro?url=${encodeURIComponent(diagnosis.url)}`}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 text-white"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}
          >
            <RotateCcw size={14} strokeWidth={1.8} />
            もう一度診断する
          </Link>
        ) : (
          <button
            onClick={handleRetake}
            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 text-white"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}
          >
            <RotateCcw size={14} strokeWidth={1.8} />
            もう一度診断する
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={handlePdf}
            className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 flex items-center justify-center gap-1.5"
          >
            <Download size={14} strokeWidth={1.8} />
            PDF保存
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

      {/* PDF保存専用の静止レイアウト。通常の閲覧では画面外に配置して隠しておき
          （heightを0+overflow:hiddenにし、ページ全体のスクロール可能領域には影響させない。
          これが無いと横に-9999pxずらしていても縦方向の高さ分だけdocumentの
          scrollHeightに加算されてしまう）、印刷（PDF保存）時だけprint-only-block
          （globals.css）が通常のフロー上に戻し、代わりにad-report-print-hide側
          （通常の閲覧UI）を非表示にする */}
      <div
        className="print-only-block"
        style={{ position: "absolute", top: 0, left: -9999, width: 900, height: 0, overflow: "hidden" }}
        aria-hidden="true"
      >
        <AiCheckPrintDocument
          url={diagnosis.url}
          totalScore={diagnosis.total_score}
          scoreMax={diagnosis.score_max}
          rank={diagnosis.rank}
          summary={diagnosis.summary}
          target={diagnosis.target}
          strengths={diagnosis.strengths}
          weaknesses={diagnosis.weaknesses}
          recommendations={diagnosis.recommendations}
          categoryScores={diagnosis.category_scores}
          createdAt={diagnosis.created_at}
        />
      </div>
    </div>
  );
}
