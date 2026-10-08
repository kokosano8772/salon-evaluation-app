"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

const LOADING_STEPS = [
  "Webサイトを確認しています...",
  "ページ構造を確認しています...",
  "店舗情報を分析しています...",
  "AI対策を分析しています...",
  "改善ポイントを作成しています...",
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
      <div className="min-h-[100dvh] bg-[#FAF8F3] flex flex-col items-center justify-center px-6 text-center">
        <Loader2 size={32} className="animate-spin text-[#C4788A] mb-6" />
        <p className="text-charcoal-900 font-semibold mb-2">サイトを分析しています</p>
        <p className="text-sm text-gray-500">{LOADING_STEPS[loadingStep]}</p>
        <p className="text-xs text-gray-400 mt-6 max-w-xs">サイトの規模によっては1分以上かかることがあります</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAF8F3] flex flex-col">
      <div className="bg-white border-b border-gray-100 px-5 py-4 sticky top-0 z-40">
        <p className="text-xs font-medium text-[#C4788A] tracking-widest uppercase text-center">Salon AI Check</p>
      </div>

      <main className="flex-1 px-5 py-10 max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            <Sparkles size={24} color="white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-charcoal-900 mb-2">美容室のAI対策、できていますか？</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            URLを入力するだけで、AI検索対策の充実度を無料で診断できます。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-luxury p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">美容室のホームページURL</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Googleビジネスプロフィールの情報（任意、分かる範囲でOK）
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
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border ${
                    hasGbp === value ? "bg-[#C4788A] text-white border-[#C4788A]" : "bg-white text-gray-500 border-gray-200"
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
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A]"
                />
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={averageRating}
                  onChange={(e) => setAverageRating(e.target.value)}
                  placeholder="評価（例: 4.3）"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A]"
                />
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-semibold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            無料で診断する
          </button>
        </form>

        <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed">
          本診断はAI検索順位を保証するものではありません。AIが店舗の情報を理解・評価するために
          必要と考えられる情報の充実度を、独自基準で診断したものです。
        </p>
      </main>
    </div>
  );
}
