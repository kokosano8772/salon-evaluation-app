"use client";

import { useCallback, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import * as repo from "@/lib/growth-db/ad-report-repository";
import { AdPlatform, AdReport } from "@/lib/growth-db/ad-report-types";
import { analyzeCampaigns, compareAdReports, compareGrowthMetrics, findPreviousAdReport } from "@/lib/growth-db/ad-report-analysis";
import { MonthlyMetrics } from "@/lib/growth-db/types";

interface AdReportAIPanelProps {
  storeId: string;
  platform: AdPlatform;
  report: AdReport;
  history: AdReport[];
  monthlyHistory: MonthlyMetrics[];
  onSaved: (aiResult: string) => void;
}

type Status = "idle" | "streaming" | "saving" | "done" | "error";

export default function AdReportAIPanel({ storeId, platform, report, history, monthlyHistory, onSaved }: AdReportAIPanelProps) {
  const [status, setStatus] = useState<Status>(report.aiResult ? "done" : "idle");
  const [streamText, setStreamText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const runAnalysis = useCallback(async () => {
    setStatus("streaming");
    setStreamText("");
    setErrorMsg("");

    try {
      const previousReport = findPreviousAdReport(history, report);
      const comparison = compareAdReports(report, previousReport);
      const campaignAnalysis = analyzeCampaigns(report.campaigns, previousReport?.campaigns ?? []);
      const growthComparison = compareGrowthMetrics(monthlyHistory, report.yearMonth);

      const res = await fetch("/api/growth-db/ad-report-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, comparison, campaignAnalysis, growthComparison }),
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
      await repo.upsertAdReport(storeId, report.yearMonth, platform, { aiResult: full });
      setStatus("done");
      onSaved(full);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "不明なエラー");
      setStatus("error");
    }
  }, [storeId, platform, report, history, monthlyHistory, onSaved]);

  const isBusy = status === "streaming" || status === "saving";

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

      {status === "streaming" && streamText && (
        <div className="mt-3 max-h-40 overflow-y-auto rounded-xl bg-gray-50 p-3">
          <p className="text-xs text-gray-500 whitespace-pre-wrap">{streamText}</p>
        </div>
      )}

      {status === "done" && !isBusy && (
        <p className="text-xs text-gray-400 mt-3">下のレポートの「運用状況とご提案」に反映されています。</p>
      )}
    </div>
  );
}
