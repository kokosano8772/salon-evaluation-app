"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, Trash2, RefreshCw, Check, X } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { KnowledgeSource, SOURCE_STATUS_LABEL, SOURCE_TYPE_LABEL } from "@/components/chatbot/types";

interface NamedUrl {
  id: string;
  name: string;
  url: string;
}

const STATUS_STYLE: Record<KnowledgeSource["status"], string> = {
  pending: "bg-gray-100 text-gray-600",
  fetched: "bg-blue-50 text-blue-600",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-50 text-red-500",
  stale: "bg-amber-50 text-amber-600",
};

export default function ChatbotKnowledgeSourcesPage() {
  const params = useParams<{ storeId: string }>();
  const storeId = params.storeId;
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [recruitmentLpUrls, setRecruitmentLpUrls] = useState<NamedUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [selectedLpUrl, setSelectedLpUrl] = useState("");

  const load = () => {
    Promise.all([
      fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources`).then((r) => r.json()),
      fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources/recruitment-lp-urls`).then((r) => r.json()),
    ])
      .then(([sourcesRes, lpRes]) => {
        setSources(sourcesRes.sources ?? []);
        setRecruitmentLpUrls(lpRes.urls ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [storeId]);

  const addSource = async (sourceType: "recruitment_lp" | "manual_url", url: string) => {
    if (!url.trim()) return;
    setError("");
    try {
      const res = await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType, url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "追加に失敗しました");
      setManualUrl("");
      setSelectedLpUrl("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    }
  };

  const handleSync = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources/${id}/sync`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "取得に失敗しました");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = async (id: string) => {
    setBusyId(id);
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources/${id}/approve`, { method: "POST" });
    setBusyId(null);
    load();
  };

  const handleReject = async (id: string) => {
    setBusyId(id);
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    setBusyId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この取得元を削除しますか？")) return;
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <DashboardHeader
        title="求人情報の取得元URL"
        description="取得しただけでは公開情報には反映されません。内容を確認して「承認」すると、FAQ・求人項目作成の参照元として使えます。"
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "求人チャットボット", href: "/dashboard/chatbot" },
          { label: storeId, href: `/dashboard/chatbot/${storeId}` },
          { label: "求人情報・FAQ", href: `/dashboard/chatbot/${storeId}/knowledge` },
          { label: "取得元URL" },
        ]}
      />

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="card-luxury p-5 mb-6 space-y-4">
        {recruitmentLpUrls.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5">成長DBに登録済みの求人LP URLから取り込み</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={selectedLpUrl}
                  onChange={(e) => setSelectedLpUrl(e.target.value)}
                  className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                >
                  <option value="">選択してください...</option>
                  {recruitmentLpUrls.map((u) => (
                    <option key={u.id} value={u.url}>
                      {u.name ? `${u.name}: ${u.url}` : u.url}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} strokeWidth={2} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={() => addSource("recruitment_lp", selectedLpUrl)}
                disabled={!selectedLpUrl}
                className="text-sm font-medium px-4 py-2 rounded-lg text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
              >
                取り込み
              </button>
            </div>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 mb-1.5">手動でURLを追加</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="https://..."
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
            <button
              onClick={() => addSource("manual_url", manualUrl)}
              disabled={!manualUrl.trim()}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-charcoal-700 disabled:opacity-50"
            >
              追加
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card-luxury p-12 h-48 animate-pulse bg-gray-50" />
      ) : (
        <div className="space-y-4">
          {sources.length === 0 && <p className="text-sm text-gray-400">取得元が未登録です。</p>}
          {sources.map((source) => (
            <div key={source.id} className="card-luxury p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mr-2">
                    {SOURCE_TYPE_LABEL[source.sourceType]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[source.status]}`}>
                    {SOURCE_STATUS_LABEL[source.status]}
                  </span>
                </div>
                <button onClick={() => handleDelete(source.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
              {source.url && <p className="text-xs text-gray-500 mb-2 break-all">{source.url}</p>}
              {source.fetchedContent && (
                <details className="mb-3">
                  <summary className="text-xs text-gray-400 cursor-pointer">取得内容を表示（直近の取得結果）</summary>
                  <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap max-h-48 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                    {source.fetchedContent}
                  </p>
                </details>
              )}
              <div className="flex items-center gap-2">
                {source.sourceType !== "manual_text" && (
                  <button
                    onClick={() => handleSync(source.id)}
                    disabled={busyId === source.id}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-charcoal-700 disabled:opacity-50"
                  >
                    <RefreshCw size={14} />
                    再取得
                  </button>
                )}
                {(source.status === "fetched" || source.status === "stale") && (
                  <>
                    <button
                      onClick={() => handleApprove(source.id)}
                      disabled={busyId === source.id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
                    >
                      <Check size={14} />
                      承認
                    </button>
                    <button
                      onClick={() => handleReject(source.id)}
                      disabled={busyId === source.id}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-50"
                    >
                      <X size={14} />
                      却下
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
