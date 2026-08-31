"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import * as repo from "@/lib/growth-db/ad-report-repository";
import { AdReport } from "@/lib/growth-db/ad-report-types";
import { compareAdReports, compareGrowthMetrics, findPreviousAdReport } from "@/lib/growth-db/ad-report-analysis";
import { YoyTrend } from "@/lib/growth-db/ad-report-trend";
import { MonthlyMetrics, NamedUrl } from "@/lib/growth-db/types";
import { stripLeadingNoise } from "@/lib/growth-db/parse-google-ad-report-ai-result";

// Google広告レポート専用のAI分析パネル。Meta用のAdReportAIPanel.tsxとは完全に分離しており、
// そちらの挙動には一切影響しない（compareAdReports/compareGrowthMetrics/findPreviousAdReportは
// プラットフォームに依存しない共通関数のためそのまま再利用する）。
interface GoogleAdReportAIPanelProps {
  storeId: string;
  report: AdReport;
  history: AdReport[];
  monthlyHistory: MonthlyMetrics[];
  trend: YoyTrend;
  homepageUrls?: NamedUrl[];
  hotpepperUrls?: NamedUrl[];
  recruitmentLpUrls?: NamedUrl[];
  onSaved: (aiResult: string) => void;
}

type Status = "idle" | "streaming" | "saving" | "done" | "error";
type EditStatus = "idle" | "saving" | "saved";

export default function GoogleAdReportAIPanel({
  storeId,
  report,
  history,
  monthlyHistory,
  trend,
  homepageUrls,
  hotpepperUrls,
  recruitmentLpUrls,
  onSaved,
}: GoogleAdReportAIPanelProps) {
  const [status, setStatus] = useState<Status>(report.aiResult ? "done" : "idle");
  const [streamText, setStreamText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [editedText, setEditedText] = useState(report.aiResult ?? "");
  const [editStatus, setEditStatus] = useState<EditStatus>("idle");

  useEffect(() => {
    setEditedText(report.aiResult ?? "");
    setEditStatus("idle");
  }, [report.aiResult]);

  const runAnalysis = useCallback(async () => {
    setStatus("streaming");
    setStreamText("");
    setErrorMsg("");

    try {
      const previousReport = findPreviousAdReport(history, report);
      const comparison = compareAdReports(report, previousReport);
      const growthComparison = compareGrowthMetrics(monthlyHistory, report.yearMonth);

      const res = await fetch("/api/growth-db/google-ad-report-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, comparison, growthComparison, trend, homepageUrls, hotpepperUrls, recruitmentLpUrls }),
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

      setStatus("saving");
      await repo.upsertAdReport(storeId, report.yearMonth, "google", { aiResult: full }, report.category);
      setStatus("done");
      onSaved(full);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "不明なエラー");
      setStatus("error");
    }
  }, [storeId, report, history, monthlyHistory, trend, homepageUrls, hotpepperUrls, recruitmentLpUrls, onSaved]);

  const saveEdit = useCallback(async () => {
    setEditStatus("saving");
    await repo.upsertAdReport(storeId, report.yearMonth, "google", { aiResult: editedText }, report.category);
    setEditStatus("saved");
    onSaved(editedText);
    setTimeout(() => setEditStatus("idle"), 2000);
  }, [storeId, report.yearMonth, report.category, editedText, onSaved]);

  const isBusy = status === "streaming" || status === "saving";
  const isDirty = editedText !== (report.aiResult ?? "");

  return (
    <div className="card-luxury p-5 ad-report-print-hide mb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-medium text-gray-400 tracking-wide flex items-center gap-1.5">
          <Sparkles size={14} strokeWidth={2} />
          AI運用状況分析（Gemini）
        </p>
        <button
          onClick={runAnalysis}
          disabled={isBusy}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} strokeWidth={2} />}
          {status === "streaming" ? "生成中..." : status === "saving" ? "保存中..." : report.aiResult ? "再生成" : "AI分析を生成"}
        </button>
      </div>

      {status === "error" && <p className="text-xs text-red-500 mt-3">{errorMsg}</p>}

      {status === "streaming" && stripLeadingNoise(streamText) && (
        <div className="mt-3 max-h-40 overflow-y-auto rounded-xl bg-gray-50 p-3">
          <p className="text-xs text-gray-500 whitespace-pre-wrap">{stripLeadingNoise(streamText)}</p>
        </div>
      )}

      {!isBusy && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-gray-400">
              AI分析を生成しなくても、ここに直接文章を書いて保存できます（"## 年代別の傾向" "## サロン様へのご提案"
              "## ココデザインが行う改善策" の見出しでレポート内の各欄に振り分けられます。ご提案・改善策の2つは、
              見出しの次の行に太字見出し、その次に本文、最後に「- 」で始まる行を2つ書くとアクションのピル表示になります）
            </p>
          </div>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={8}
            placeholder="運用状況の分析文章をここに直接入力できます"
            className="w-full text-xs text-charcoal-700 leading-relaxed rounded-xl border border-gray-200 p-3 focus:outline-none focus:border-[#C4788A]"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={saveEdit}
              disabled={!isDirty || editStatus === "saving"}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              {editStatus === "saving" && <Loader2 size={13} className="animate-spin" />}
              {editStatus === "saved" && <Check size={13} />}
              {editStatus === "saving" ? "保存中..." : editStatus === "saved" ? "保存しました" : "編集内容を保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
