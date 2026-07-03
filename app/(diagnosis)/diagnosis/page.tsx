"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowDown, ChevronLeft, RotateCcw, Lock, Eye, EyeOff, X, Zap } from "lucide-react";
import { useDiagnosisStore } from "@/store/diagnosisStore";
import { CATEGORIES } from "@/lib/scoring";
import { Category } from "@/lib/types";
import QuestionCard from "@/components/diagnosis/QuestionCard";
import ProgressHeader from "@/components/diagnosis/ProgressHeader";
import CategoryIcon from "@/components/ui/CategoryIcon";

const ACCESS_CODE = "KOKO2025";
const AUTH_KEY = "svs-pro-auth";

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
    <div className="min-h-[100dvh] bg-[#FAF8F3] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            <Lock size={28} strokeWidth={1.8} color="white" />
          </div>
          <p className="text-[#C4788A] text-xs font-medium tracking-[0.3em] uppercase mb-2">
            Salon Value Score
          </p>
          <h1 className="text-charcoal-900 text-2xl font-bold text-center leading-snug">
            詳細診断
          </h1>
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
                borderColor: error ? "#ef4444" : input ? "#C4788A" : "#e5e7eb",
                backgroundColor: error ? "#fef2f2" : "white",
              }}
            />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showCode ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-500 text-sm text-center"
              >
                アクセスコードが違います
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!input}
            className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            <span>入る</span>
            <ArrowRight size={18} strokeWidth={2} />
          </motion.button>
        </form>

        <p className="text-gray-400 text-xs text-center mt-6">
          一般の方は
          <a href="/quick" className="text-[#C4788A] underline ml-1">簡易診断</a>
          をご利用ください
        </p>
      </motion.div>
    </div>
  );
}

function SalonInfoStep({ onSubmit }: { onSubmit: (name: string, phone: string) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onSubmit(name.trim(), phone.trim());
  };

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F3] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <p className="text-[#C4788A] text-xs font-medium tracking-[0.3em] uppercase mb-2">
            Salon Value Score — Pro
          </p>
          <h1 className="text-charcoal-900 text-2xl font-bold text-center leading-snug">
            サロン情報の入力
          </h1>
          <p className="text-gray-500 text-sm text-center mt-2 leading-relaxed">
            診断結果を成長データベースに連携するため、
            <br />
            サロン名・電話番号を入力してください。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">サロン名</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="例）hair salon Rume"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
            />
          </label>
          <label className="block">
            <span className="block text-xs text-gray-500 mb-1.5">電話番号</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="09012345678"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
            />
          </label>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!name.trim() || !phone.trim()}
            className="w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            <span>診断を始める</span>
            <ArrowRight size={18} strokeWidth={2} />
          </motion.button>
        </form>
      </div>
    </div>
  );
}

export default function DiagnosisPage() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const router = useRouter();
  const {
    currentQuestionIndex,
    answers,
    salonName,
    salonPhone,
    setSalonInfo,
    setAnswer,
    nextQuestion,
    previousQuestion,
    getCurrentQuestion,
    getCurrentCategory,
    getTotalQuestions,
    getCurrentAnswer,
    completeAndCalculate,
    reset,
  } = useDiagnosisStore();

  const [showIntro, setShowIntro] = useState(true);
  const [showCategoryIntro, setShowCategoryIntro] = useState(false);
  const [introCategory, setIntroCategory] = useState(CATEGORIES[0]);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setIsAuthorized(!!sessionStorage.getItem(AUTH_KEY));
  }, []);

  const question = getCurrentQuestion();
  const category = getCurrentCategory();
  const totalQuestions = getTotalQuestions();
  const currentAnswer = getCurrentAnswer();
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  useEffect(() => {
    if (!question || !category) return;
    const isFirstInCategory = question.id === category.questions[0].id;
    if (isFirstInCategory && currentQuestionIndex > 0 && direction === "next") {
      setIntroCategory(category);
      setShowCategoryIntro(true);
      const timer = setTimeout(() => setShowCategoryIntro(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentQuestionIndex, question, category, direction]);

  if (isAuthorized === null) return null;
  if (!isAuthorized) return <AccessGate onUnlock={() => setIsAuthorized(true)} />;

  if (showIntro) {
    return (
      <main className="min-h-screen bg-[#FAF8F3] flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-charcoal-950 min-h-[100dvh] flex flex-col">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ x: [0, -200, 80, -160, 0], y: [0, 160, -120, 220, 0], scale: [1, 1.5, 0.75, 1.6, 1], opacity: [0.18, 0.35, 0.12, 0.32, 0.18] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full"
              style={{ background: "radial-gradient(circle, #C4788A 0%, transparent 70%)" }}
            />
            <motion.div
              animate={{ x: [0, 220, -120, 180, 0], y: [0, -180, 140, -220, 0], scale: [1, 0.65, 1.55, 0.8, 1], opacity: [0.18, 0.12, 0.38, 0.15, 0.18] }}
              transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full"
              style={{ background: "radial-gradient(circle, #C4788A 0%, transparent 70%)" }}
            />
            <motion.div
              animate={{ x: [0, 240, -180, 160, -200, 0], y: [0, -160, 200, -180, 120, 0], scale: [0.7, 1.4, 0.85, 1.5, 0.7], opacity: [0.06, 0.14, 0.07, 0.16, 0.06] }}
              transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
              style={{ background: "radial-gradient(circle, #C4788A 0%, transparent 60%)" }}
            />
          </div>

          <header className="relative z-10 px-6 pt-12 pb-4">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="text-[#C4788A] text-xs font-medium tracking-[0.3em] uppercase">
                Salon Value Score — Pro
              </span>
            </motion.div>
          </header>

          <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <p className="text-[#C4788A] text-sm font-medium tracking-[0.2em] mb-4 uppercase">
                美容室価値診断
              </p>
              <h1 className="text-white text-4xl leading-tight mb-6">
                選ばれ続ける
                <br />
                <span style={{ background: "linear-gradient(135deg, #C4788A 0%, #DA9EAD 50%, #C4788A 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", display: "inline-block" }}>
                  サロンの力
                </span>
                を<br />
                可視化する。
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-10">
                売上だけではわからない
                <br />「 将来も選ばれ続ける力 」を
                <br />
                100点満点でスコアリング。
                <br />
                あなたのサロンの本当の価値を診断します。
              </p>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowIntro(false)}
                className="w-full py-5 rounded-2xl text-white font-semibold text-base tracking-wide relative overflow-hidden flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)", boxShadow: "0 8px 32px rgba(196, 120, 138, 0.35)" }}
              >
                <span>無料で診断する</span>
                <ArrowRight size={18} strokeWidth={2} />
              </motion.button>

              <p className="text-gray-500 text-xs text-center mt-3">
                所要時間：約5〜8分（30問）／ 登録不要
                {currentQuestionIndex > 0 && "　／　前回の途中から再開"}
              </p>
            </motion.div>
          </div>

          <motion.div className="relative z-10 flex justify-center pb-8" animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <div className="flex flex-col items-center gap-1 opacity-40">
              <span className="text-white text-[10px] tracking-widest">SCROLL</span>
              <ArrowDown size={16} strokeWidth={1.5} color="white" />
            </div>
          </motion.div>
        </section>

        {/* About Section */}
        <section className="px-6 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-[#C4788A] text-xs font-medium tracking-[0.3em] uppercase mb-4">About</p>
            <h2 className="text-2xl font-bold text-charcoal-900 mb-4 leading-snug">
              経営の「本当の強さ」は
              <br />
              数字に表れない
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              売上は結果。大切なのは、その売上を
              <strong className="text-charcoal-900">生み続ける構造</strong>
              があるかどうかです。
              <br /><br />
              Salon Value Scoreは、商品力・顧客支持力・ブランド力・採用力・組織力・将来性の
              <strong className="text-charcoal-900">6つの軸</strong>
              で、あなたのサロンの「選ばれ続ける力」を診断します。
            </p>
          </motion.div>
        </section>

        {/* 6 Categories Section */}
        <section className="px-6 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8">
            <p className="text-[#C4788A] text-xs font-medium tracking-[0.3em] uppercase mb-4">6 Categories</p>
            <h2 className="text-2xl font-bold text-charcoal-900 leading-snug">診断の6つの軸</h2>
          </motion.div>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCategory(cat)}
                className="card-luxury p-4 text-left w-full relative"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${cat.color}18` }}>
                  <CategoryIcon icon={cat.icon} size={20} color={cat.color} strokeWidth={1.8} />
                </div>
                <p className="font-semibold text-charcoal-900 text-sm mb-1">{cat.name}</p>
                <p className="text-gray-500 text-xs">{cat.maxScore}点満点</p>
                <span className="absolute bottom-3 right-3 flex items-center gap-0.5 text-[10px] font-medium tracking-wide" style={{ color: `${cat.color}99` }}>
                  詳細 <ArrowRight size={10} strokeWidth={2} />
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Rank Section */}
        <section className="px-6 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-8">
            <p className="text-[#C4788A] text-xs font-medium tracking-[0.3em] uppercase mb-4">Rank System</p>
            <h2 className="text-2xl font-bold text-charcoal-900 leading-snug">5段階のランク判定</h2>
          </motion.div>
          <div className="space-y-2">
            {[
              { rank: "S", range: "90〜100点", label: "業界トップクラス", color: "#C4788A" },
              { rank: "A", range: "80〜89点", label: "高水準の経営力", color: "#7C9EB5" },
              { rank: "B", range: "65〜79点", label: "平均以上の実力", color: "#9B8DBF" },
              { rank: "C", range: "50〜64点", label: "仕組み化で安定へ", color: "#6BAB8A" },
              { rank: "D", range: "〜49点", label: "今すぐ改革が必要", color: "#E08B6B" },
            ].map((item, i) => (
              <motion.div
                key={item.rank}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: item.color }}>
                  {item.rank}
                </div>
                <div>
                  <p className="font-semibold text-charcoal-900 text-sm">{item.label}</p>
                  <p className="text-gray-500 text-xs">{item.range}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 pb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-[#1a1a1a] rounded-3xl p-8 text-center">
            <p className="text-white text-2xl font-bold mb-3 leading-snug">
              あなたのサロンは
              <br />
              何点ですか？
            </p>
            <p className="text-gray-400 text-sm mb-8">今すぐ無料で診断してみましょう</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowIntro(false)}
              className="w-full py-5 rounded-2xl text-white font-semibold text-base tracking-wide flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)", boxShadow: "0 8px 32px rgba(196, 120, 138, 0.35)" }}
            >
              <span>診断を始める</span>
              <ArrowRight size={18} strokeWidth={2} />
            </motion.button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-gray-200 space-y-3">
          <div className="flex items-center justify-center gap-4">
            <Link href="/privacy" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">プライバシーポリシー</Link>
            <span className="text-gray-300 text-xs">|</span>
            <Link href="/terms" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">利用規約</Link>
            <span className="text-gray-300 text-xs">|</span>
            <a href="https://koko-design.com/contact/" target="_blank" rel="noopener noreferrer" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">お問い合わせ</a>
          </div>
          <p className="text-gray-400 text-xs text-center">© 2024 Salon Value Score. All rights reserved.</p>
        </footer>

        {/* Category detail modal */}
        <AnimatePresence>
          {selectedCategory && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" onClick={() => setSelectedCategory(null)} />
              <motion.div
                initial={{ opacity: 0, y: 80, scale: 0.93 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 80, scale: 0.95 }}
                transition={{ type: "spring", damping: 26, stiffness: 320 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.4 }}
                dragMomentum={false}
                onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) setSelectedCategory(null); }}
                style={{ x: "-50%" }}
                className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl cursor-grab active:cursor-grabbing touch-none"
              >
                <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
                <button onClick={() => setSelectedCategory(null)} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <X size={15} strokeWidth={2.2} />
                </button>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${selectedCategory.color}18` }}>
                    <CategoryIcon icon={selectedCategory.icon} size={24} color={selectedCategory.color} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium tracking-widest uppercase" style={{ color: selectedCategory.color }}>{selectedCategory.nameEn}</p>
                    <h3 className="text-xl font-bold text-charcoal-900">{selectedCategory.name}</h3>
                  </div>
                  <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ color: selectedCategory.color, backgroundColor: `${selectedCategory.color}14` }}>
                    {selectedCategory.maxScore}点
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{selectedCategory.description}</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">診断項目</p>
                <div className="space-y-2.5">
                  {selectedCategory.questions.map((q) => (
                    <div key={q.id} className="flex items-start gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: selectedCategory.color }} />
                      <div>
                        <p className="text-sm text-charcoal-900 font-medium">{q.label}</p>
                        {q.hint && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{q.hint}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    );
  }

  if (!salonName || !salonPhone) {
    return <SalonInfoStep onSubmit={setSalonInfo} />;
  }

  if (!question || !category) return null;

  const handleAnswer = (value: number) => setAnswer(question.id, value);

  const handleNext = () => {
    if (currentAnswer === undefined) return;
    setDirection("next");
    if (isLastQuestion) {
      setIsAnalyzing(true);
      setTimeout(() => {
        completeAndCalculate();
        router.push("/result");
      }, 2200);
      return;
    }
    nextQuestion();
  };

  const handlePrev = () => {
    setDirection("prev");
    previousQuestion();
  };

  const isAnswered = currentAnswer !== undefined;

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F3] flex flex-col">
      <ProgressHeader
        currentIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        answers={answers}
      />

      {/* Analyzing Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backdropFilter: "blur(16px)", backgroundColor: "rgba(250,248,243,0.7)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 260, damping: 22 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Spinner rings */}
              <div className="relative w-20 h-20">
                <motion.div
                  className="absolute inset-0 rounded-full border-2"
                  style={{ borderColor: "rgba(201,168,76,0.2)" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: "#C4788A" }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-3 rounded-full border border-transparent"
                  style={{ borderTopColor: "#DA9EAD", borderRightColor: "#DA9EAD" }}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#C4788A" }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
              </div>

              {/* Text */}
              <div className="text-center">
                <p className="text-charcoal-900 text-lg font-semibold tracking-widest mb-1">
                  診断中
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    ...
                  </motion.span>
                </p>
                <p className="text-gray-400 text-xs tracking-wider">あなたのサロンを分析しています</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Intro Overlay */}
      <AnimatePresence>
        {showCategoryIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(26,26,26,0.88)" }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="text-center px-8"
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: `${introCategory.color}25` }}
              >
                <CategoryIcon
                  icon={introCategory.icon}
                  size={40}
                  color={introCategory.color}
                  strokeWidth={1.4}
                />
              </div>
              <p
                className="text-white text-3xl font-bold mb-2"
              >
                {introCategory.name}
              </p>
              <p className="text-gray-400 text-sm mb-3">{introCategory.nameEn}</p>
              <p className="text-gray-300 text-sm leading-relaxed">{introCategory.description}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 px-5 py-6 flex flex-col">
        <AnimatePresence mode="wait">
          <QuestionCard
            key={question.id}
            question={question}
            category={category}
            currentAnswer={currentAnswer}
            onAnswer={handleAnswer}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={totalQuestions}
          />
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 space-y-3">
          <motion.button
            onClick={handleNext}
            disabled={!isAnswered}
            whileTap={isAnswered ? { scale: 0.97 } : {}}
            className="w-full py-5 rounded-2xl font-semibold text-base tracking-wide transition-all duration-300 flex items-center justify-center gap-2"
            style={{
              background: isAnswered
                ? `linear-gradient(135deg, ${category.color} 0%, ${category.color}99 100%)`
                : "#e5e5e5",
              color: isAnswered ? "white" : "#aaa",
              boxShadow: isAnswered ? `0 8px 24px ${category.color}40` : "none",
            }}
          >
            {!isAnswered ? (
              "回答を選択してください"
            ) : isLastQuestion ? (
              <>
                診断結果を見る
                <ArrowRight size={18} strokeWidth={2} />
              </>
            ) : (
              <>
                次の質問へ
                <ArrowRight size={18} strokeWidth={2} />
              </>
            )}
          </motion.button>

          {!isFirstQuestion && (
            <button
              onClick={handlePrev}
              className="w-full py-3 rounded-xl text-gray-500 text-sm font-medium bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <ChevronLeft size={16} strokeWidth={1.8} />
              前の質問に戻る
            </button>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={reset}
            className="text-gray-400 text-xs flex items-center justify-center gap-1 mx-auto"
          >
            <RotateCcw size={11} strokeWidth={1.8} />
            最初からやり直す
          </button>
        </div>
      </main>
    </div>
  );
}
