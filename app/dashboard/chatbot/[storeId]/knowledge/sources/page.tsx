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
  // 取得内容の編集中ドラフト。source.idごとに持ち、未編集なら保存済みの内容をそのまま表示する。
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

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
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "取得に失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveContent = async (id: string) => {
    const draft = drafts[id];
    if (draft === undefined) return;
    setSavingId(id);
    setError("");
    try {
      const res = await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualText: draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存に失敗しました");
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSavingId(null);
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
        description="登録したURLの内容をAIが読みやすく整理し、確認・承認した分だけチャットボットの回答に使われます。"
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "求人チャットボット", href: "/dashboard/chatbot" },
          { label: storeId, href: `/dashboard/chatbot/${storeId}` },
          { label: "求人情報・FAQ", href: `/dashboard/chatbot/${storeId}/knowledge` },
          { label: "取得元URL" },
        ]}
      />

      <div className="card-luxury p-4 mb-6 bg-gray-50/60">
        <p className="text-xs font-medium text-charcoal-700 mb-2">使い方の流れ</p>
        <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
          <li>下でURLを登録する</li>
          <li>「再取得」で最新の内容を取り込む（AIが読みやすく整理します）</li>
          <li>内容を確認する。必要ならそのまま書き換えて「保存」できる</li>
          <li>問題なければ「承認」。承認した内容だけがチャットボットの回答に使われる</li>
        </ol>
      </div>

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
              {source.url && <p className="text-xs text-gray-500 mb-3 break-all">{source.url}</p>}

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-gray-500">取得内容（書き換えて保存できます）</p>
                  {drafts[source.id] !== undefined && drafts[source.id] !== source.fetchedContent && (
                    <button
                      onClick={() => handleSaveContent(source.id)}
                      disabled={savingId === source.id}
                      className="text-xs font-medium px-2.5 py-1 rounded-md text-white disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
                    >
                      {savingId === source.id ? "保存中..." : "保存"}
                    </button>
                  )}
                </div>
                <textarea
                  value={drafts[source.id] ?? source.fetchedContent ?? ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [source.id]: e.target.value }))}
                  placeholder="まだ内容がありません。「再取得」を押すか、ここに直接入力してください。"
                  rows={6}
                  className="w-full text-xs text-charcoal-700 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap focus:outline-none focus:ring-1 focus:ring-[#C4788A]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                {source.sourceType !== "manual_text" && (
                  <button
                    onClick={() => handleSync(source.id)}
                    disabled={busyId === source.id}
                    title="URL先の最新の内容を取り直し、AIが読みやすく整理し直します"
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 mt-2 rounded-lg border border-gray-200 text-charcoal-700 disabled:opacity-50"
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
                      title="上の内容をチャットボットの回答に使えるようにします"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 mt-2 rounded-lg text-white disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
                    >
                      <Check size={14} />
                      承認
                    </button>
                    <button
                      onClick={() => handleReject(source.id)}
                      disabled={busyId === source.id}
                      title="この内容は使わない（却下）"
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 mt-2 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-50"
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
