"use client";

import { use, useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { RotateCcw, CheckCircle2, Flag } from "lucide-react";

const ACCENT = "#C4788A";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pass: { label: "OK", color: "#16a34a", bg: "bg-green-50" },
  partial: { label: "一部OK", color: "#d97706", bg: "bg-amber-50" },
  fail: { label: "未対応", color: "#dc2626", bg: "bg-red-50" },
  unknown: { label: "未確認", color: "#9ca3af", bg: "bg-gray-50" },
  not_applicable: { label: "対象外", color: "#9ca3af", bg: "bg-gray-50" },
};

interface ScoredItem {
  itemKey: string;
  category: string;
  label: string;
  score: number;
  maxScore: number;
  status: string;
  evidence: { source_url: string | null; excerpt: string; note: string } | null;
}

interface AuditRun {
  id: string;
  status: string;
  total_score: number | null;
  total_max_score: number | null;
  review_status: string;
  crawl_warning: string | null;
  crawl_error: string | null;
  created_at: string;
}

export default function WebAssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [webAsset, setWebAsset] = useState<{ url: string; site_type: string } | null>(null);
  const [salon, setSalon] = useState<{ name: string } | null>(null);
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [items, setItems] = useState<ScoredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/web-ranking/web-assets/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "取得に失敗しました");
      setWebAsset(json.webAsset);
      setSalon(json.salon);
      setRuns(json.runs ?? []);
      setItems(json.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRunAudit = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await fetch(`/api/web-ranking/web-assets/${id}/audit-runs`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "診断に失敗しました");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "診断に失敗しました");
    } finally {
      setRunning(false);
    }
  };

  const handleReview = async (reviewStatus: "reviewed_ok" | "reviewed_flagged") => {
    const latestRun = runs[0];
    if (!latestRun) return;
    await fetch(`/api/web-ranking/audit-runs/${latestRun.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus }),
    });
    await load();
  };

  const latestRun = runs[0];
  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div>
      <DashboardHeader
        title={salon?.name ?? "サイト詳細"}
        description={webAsset?.url}
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "WEBランキング", href: "/dashboard/web-ranking" },
          { label: "サイト詳細" },
        ]}
        actions={
          <button
            onClick={handleRunAudit}
            disabled={running}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: ACCENT }}
          >
            <RotateCcw size={15} strokeWidth={2} />
            {running ? "診断中..." : latestRun ? "再診断する" : "診断を実行する"}
          </button>
        }
      />

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {loading ? (
        <div className="h-40 rounded-2xl bg-gray-50 animate-pulse" />
      ) : !latestRun ? (
        <p className="text-sm text-gray-400">まだ診断が実行されていません。「診断を実行する」から開始してください。</p>
      ) : latestRun.status === "failed" ? (
        <div className="bg-red-50 rounded-2xl p-5 text-sm text-red-700">診断に失敗しました：{latestRun.crawl_error}</div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold" style={{ color: ACCENT }}>
                  {latestRun.total_score} <span className="text-base text-gray-400 font-normal">/ {latestRun.total_max_score}点</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(latestRun.created_at).toLocaleString("ja-JP")} 診断
                  {latestRun.crawl_warning && ` ／ ${latestRun.crawl_warning}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {latestRun.review_status === "unreviewed" ? (
                  <>
                    <button
                      onClick={() => handleReview("reviewed_ok")}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-green-50 text-green-700"
                    >
                      <CheckCircle2 size={13} strokeWidth={2} />
                      確認済みにする
                    </button>
                    <button
                      onClick={() => handleReview("reviewed_flagged")}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700"
                    >
                      <Flag size={13} strokeWidth={2} />
                      要確認フラグ
                    </button>
                  </>
                ) : (
                  <span
                    className={`text-xs font-semibold px-3 py-2 rounded-lg ${
                      latestRun.review_status === "reviewed_ok" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {latestRun.review_status === "reviewed_ok" ? "確認済み" : "要確認フラグ中"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {categories.map((category) => {
              const categoryItems = items.filter((i) => i.category === category);
              return (
                <div key={category} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">{category}</p>
                  <div className="space-y-2">
                    {categoryItems.map((item) => {
                      const s = STATUS_LABEL[item.status] ?? STATUS_LABEL.unknown;
                      return (
                        <div key={item.itemKey} className={`rounded-lg px-3 py-2 ${s.bg}`}>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-charcoal-800 flex-1">{item.label}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {item.score}/{item.maxScore}
                            </span>
                            <span className="text-xs font-semibold flex-shrink-0" style={{ color: s.color }}>
                              {s.label}
                            </span>
                          </div>
                          {item.evidence && (item.evidence.excerpt || item.evidence.note) && (
                            <p className="text-[11px] text-gray-500 leading-relaxed mt-1.5 pt-1.5 border-t border-black/5">
                              {item.evidence.note || item.evidence.excerpt}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {runs.length > 1 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-gray-400 mb-2">診断履歴（{runs.length}件）</p>
          <div className="space-y-1.5">
            {runs.map((run) => (
              <div key={run.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-xs text-gray-500">
                <span>{new Date(run.created_at).toLocaleString("ja-JP")}</span>
                <span>
                  {run.status === "completed" ? `${run.total_score}/${run.total_max_score}点` : run.status === "failed" ? "失敗" : run.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
