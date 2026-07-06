"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Lightbulb,
  Loader2,
  Megaphone,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { AnalysisMode, ComparisonData, SalonData } from "@/lib/competitor-research/types";

const SECTIONS = [
  { heading: "自社の強み", icon: TrendingUp, color: "#16a34a" },
  { heading: "自社の弱み", icon: TrendingDown, color: "#dc2626" },
  { heading: "競合優位点", icon: Target, color: "#d97706" },
  { heading: "改善ポイント", icon: Lightbulb, color: "#2563eb" },
  { heading: "差別化ポイント", icon: Sparkles, color: "#9333ea" },
  { heading: "価格戦略", icon: Wallet, color: "#4f46e5" },
  { heading: "求人改善案", icon: Users, color: "#0d9488" },
  { heading: "集客改善案", icon: Megaphone, color: "#ea580c" },
] as const;

function parseSections(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const headings = SECTIONS.map((s) => s.heading);

  const parts = text.split(/^## /m);
  for (const part of parts) {
    const newline = part.indexOf("\n");
    if (newline === -1) continue;
    const heading = part.slice(0, newline).trim();
    const body = part.slice(newline + 1).trim();
    if (headings.includes(heading as (typeof headings)[number])) {
      result[heading] = body;
    }
  }
  return result;
}

interface CompetitorAIAnalysisPanelProps {
  storeId: string;
  salons: SalonData[];
  mode: AnalysisMode;
  cellData: ComparisonData;
  initialResult?: string | null;
  onComplete?: (result: string) => void;
}

type Status = "idle" | "streaming" | "done" | "error";

export default function CompetitorAIAnalysisPanel({
  salons,
  mode,
  cellData,
  initialResult,
  onComplete,
}: CompetitorAIAnalysisPanelProps) {
  const [status, setStatus] = useState<Status>(initialResult ? "done" : "idle");
  const [streamText, setStreamText] = useState(initialResult ?? "");
  const [errorMsg, setErrorMsg] = useState("");

  const sections = parseSections(streamText);

  const runAnalysis = useCallback(async () => {
    setStatus("streaming");
    setStreamText("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/growth-db/competitor-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salons, mode, cellData }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamText(full);
      }

      setStatus("done");
      onComplete?.(full);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "不明なエラー");
      setStatus("error");
    }
  }, [salons, mode, cellData, onComplete]);

  const isStreaming = status === "streaming";
  const hasContent = streamText.length > 0;

  return (
    <div className="card-luxury p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <p className="text-xs font-medium text-gray-400 tracking-wide flex items-center gap-1.5">
          <Sparkles size={14} strokeWidth={2} />
          AI競合分析レポート（Gemini）
        </p>
        <button
          onClick={runAnalysis}
          disabled={isStreaming}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          {isStreaming ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} strokeWidth={2} />}
          {isStreaming ? "生成中..." : hasContent ? "再分析" : "AI分析を実行"}
        </button>
      </div>

      {status === "error" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 mb-4">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-600">分析に失敗しました</p>
            <p className="text-xs text-red-500 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {!hasContent && !isStreaming && status !== "error" && (
        <p className="text-sm text-gray-400 py-4 text-center">
          比較表のデータをもとに、強み・弱み・改善ポイントなどをAIが生成します。
        </p>
      )}

      {hasContent && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((sec, i) => {
            const Icon = sec.icon;
            const content = sections[sec.heading];
            const isCurrentSection = isStreaming && !content && streamText.includes(`## ${sec.heading}`);
            const isPending = !content && !isCurrentSection;

            return (
              <motion.div
                key={sec.heading}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                className="bg-white rounded-2xl border border-gray-100 p-4"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${sec.color}1a` }}>
                    <Icon size={16} color={sec.color} />
                  </div>
                  <h3 className="font-semibold text-sm" style={{ color: sec.color }}>{sec.heading}</h3>
                  {isCurrentSection && (
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-[#C4788A]">
                      <Loader2 size={11} className="animate-spin" />
                      生成中…
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                  {isPending && isStreaming ? (
                    <div className="space-y-2">
                      {[80, 60, 70].map((w, idx) => (
                        <div key={idx} className="h-3 rounded-full bg-gray-100 animate-pulse" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  ) : isPending ? (
                    <span className="text-gray-400 italic">未分析</span>
                  ) : (
                    content
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {isStreaming && !hasContent && (
        <div className="flex items-center justify-center py-12 gap-3">
          <Loader2 size={20} className="animate-spin text-[#C4788A]" />
          <p className="text-sm text-gray-400">Geminiが分析中です…</p>
        </div>
      )}
    </div>
  );
}
