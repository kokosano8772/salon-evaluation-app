"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { FlowVersion } from "@/components/chatbot/types";

const SAMPLE_FLOW = {
  nodes: [
    { id: "start", type: "start", nextNodeId: "ask" },
    {
      id: "ask",
      type: "choice",
      text: "ご質問の内容を選んでください",
      options: [
        { label: "求人について質問する", nextNodeId: "notice_question" },
        { label: "応募・見学を申し込む", nextNodeId: "contact" },
      ],
    },
    { id: "notice_question", type: "notice", text: "AIチャットへご案内します", nextNodeId: "end" },
    { id: "contact", type: "contact_form", text: "応募フォームです", nextNodeId: "end" },
    { id: "end", type: "end" },
  ],
};

export default function ChatbotFlowPage() {
  const params = useParams<{ storeId: string }>();
  const storeId = params.storeId;
  const [versions, setVersions] = useState<FlowVersion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const load = () => {
    fetch(`/api/chatbot/admin/flow-versions?storeId=${storeId}`)
      .then((r) => r.json())
      .then((json) => {
        const list: FlowVersion[] = json.versions ?? [];
        setVersions(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
          setDraftText(JSON.stringify(list[0].draftJson, null, 2));
        } else {
          setDraftText(JSON.stringify(SAMPLE_FLOW, null, 2));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [storeId]);

  const selected = versions.find((v) => v.id === selectedId) ?? null;

  const handleCreateVersion = async () => {
    const res = await fetch("/api/chatbot/admin/flow-versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId }),
    });
    const json = await res.json();
    if (res.ok) load();
  };

  const handleSaveDraft = async () => {
    if (!selectedId) {
      await handleCreateVersion();
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const parsed = JSON.parse(draftText);
      const res = await fetch(`/api/chatbot/admin/flow-versions/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftJson: parsed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存に失敗しました");
      setMessage("下書きを保存しました");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "JSONの形式が正しくありません");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedId) return;
    setPublishing(true);
    setError("");
    setMessage("");
    setValidationErrors([]);
    try {
      await handleSaveDraft();
      const res = await fetch(`/api/chatbot/admin/flow-versions/${selectedId}/publish`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setValidationErrors(json.details ?? []);
        throw new Error(json.error ?? "公開に失敗しました");
      }
      setMessage("フローを公開しました");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "公開に失敗しました");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;

  return (
    <div>
      <DashboardHeader
        title="選択式フロー"
        description="公開を押すまで、編集中の下書きは公開中のチャットボットに反映されません。P1時点ではJSON形式での編集です。"
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "求人チャットボット", href: "/dashboard/chatbot" },
          { label: storeId, href: `/dashboard/chatbot/${storeId}` },
          { label: "選択式フロー" },
        ]}
      />

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {validationErrors.length > 0 && (
        <ul className="text-red-500 text-xs mb-4 list-disc pl-5">
          {validationErrors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
      {message && <p className="text-green-600 text-sm mb-4">{message}</p>}

      {versions.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <select
            value={selectedId ?? ""}
            onChange={(e) => {
              const v = versions.find((ver) => ver.id === e.target.value);
              setSelectedId(e.target.value);
              setDraftText(JSON.stringify(v?.draftJson ?? {}, null, 2));
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version} {v.publishedAt ? "（公開済み）" : "（未公開）"}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateVersion}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-charcoal-700"
          >
            新しいバージョンを作成
          </button>
        </div>
      )}

      <div className="card-luxury p-5">
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          rows={20}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono"
        />
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-charcoal-700 disabled:opacity-50"
          >
            下書き保存
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || !selectedId}
            className="text-sm font-medium px-4 py-2 rounded-lg text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            {publishing ? "公開中..." : "公開する（検証あり）"}
          </button>
          {selected?.publishedAt && (
            <span className="text-xs text-gray-400">
              最終公開: {new Date(selected.publishedAt).toLocaleString("ja-JP")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
