"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { GROWTH_CATEGORY_META } from "@/lib/growth-db/constants";
import { GrowthCategoryId } from "@/lib/growth-db/types";
import { AiGrowthSuggestion } from "@/lib/ai/types";
import CategoryIcon from "@/components/ui/CategoryIcon";

function isGrowthCategoryId(id: string): id is GrowthCategoryId {
  return id in GROWTH_CATEGORY_META;
}

export default function AIImprovementSuggestions({
  storeId,
  yearMonth,
}: {
  storeId: string;
  yearMonth: string;
}) {
  const [suggestions, setSuggestions] = useState<AiGrowthSuggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/growth-db/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, yearMonth }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "生成に失敗しました");
      }
      setSuggestions(data.suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-luxury p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-xs font-medium text-gray-400 tracking-wide flex items-center gap-1.5">
          <Sparkles size={14} strokeWidth={2} />
          AI改善提案（Gemini・{yearMonth}分のデータをもとに生成）
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} strokeWidth={2} />}
          {loading ? "生成中..." : suggestions ? "再生成する" : "AI提案を生成する"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!suggestions && !error && !loading && (
        <p className="text-sm text-gray-400 py-4 text-center">
          ボタンを押すと、当月の実績データをもとにカテゴリ別の改善提案をAIが生成します。
        </p>
      )}

      {suggestions && (
        <div className="space-y-3">
          {suggestions.map((s, i) => {
            const meta = isGrowthCategoryId(s.categoryId) ? GROWTH_CATEGORY_META[s.categoryId] : null;
            return (
              <motion.div
                key={`${s.categoryId}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                className="bg-white rounded-2xl border border-gray-100 p-5"
              >
                {meta && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white mb-2"
                    style={{ backgroundColor: meta.color }}
                  >
                    <CategoryIcon icon={meta.icon} size={11} color="white" strokeWidth={2} />
                    <span>{meta.name}</span>
                  </div>
                )}
                <h3 className="text-charcoal-900 font-bold text-sm leading-snug mb-1.5">{s.title}</h3>
                <p className="text-gray-600 text-xs leading-relaxed">{s.description}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
