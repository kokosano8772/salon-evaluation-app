"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FlowEditor from "@/components/chatbot/FlowEditor";
import { Flow, FlowNode, FlowVersion } from "@/components/chatbot/types";

const SAMPLE_FLOW: Flow = {
  nodes: [
    { id: "start", type: "start", nextNodeId: "ask" },
    {
      id: "ask",
      type: "choice",
      text: "ご質問の内容を選んでください",
      options: [
        { label: "LINEで気軽に質問したい", nextNodeId: "line_apply" },
        { label: "応募したい", nextNodeId: "email_apply" },
        { label: "電話で聞きたい", nextNodeId: "phone_apply" },
      ],
    },
    { id: "line_apply", type: "apply_action", method: "line", text: "LINEで気軽にご質問ください。", lineUrl: "https://lin.ee/your-line-id" },
    {
      id: "email_apply",
      type: "apply_action",
      method: "email",
      text: "以下のフォームからご応募ください。",
      fields: { askDesiredPosition: true, askEmploymentType: true },
    },
    { id: "phone_apply", type: "apply_action", method: "phone", text: "お電話でもお問い合わせいただけます。", phoneNumber: "03-1234-5678" },
  ],
};

function isFlow(value: unknown): value is Flow {
  return !!value && typeof value === "object" && Array.isArray((value as Flow).nodes);
}

export default function ChatbotFlowPage() {
  const params = useParams<{ storeId: string }>();
  const storeId = params.storeId;
  const [versions, setVersions] = useState<FlowVersion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<FlowNode[]>(SAMPLE_FLOW.nodes);
  const [mode, setMode] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const applyLoadedFlow = (flow: unknown) => {
    const loadedNodes = isFlow(flow) ? flow.nodes : SAMPLE_FLOW.nodes;
    setNodes(loadedNodes);
    setJsonText(JSON.stringify({ nodes: loadedNodes }, null, 2));
  };

  const load = () => {
    fetch(`/api/chatbot/admin/flow-versions?storeId=${storeId}`)
      .then((r) => r.json())
      .then((json) => {
        const list: FlowVersion[] = json.versions ?? [];
        setVersions(list);
        if (list.length > 0) {
          setSelectedId(list[0].id);
          applyLoadedFlow(list[0].draftJson);
        } else {
          applyLoadedFlow(SAMPLE_FLOW);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [storeId]);

  const selected = versions.find((v) => v.id === selectedId) ?? null;

  // フォーム編集とJSON編集は同じ状態を共有する。切り替え時に同期し、
  // JSON側の不正な入力は切り替え時にエラー表示して取り込まない。
  const switchToJson = () => {
    setJsonText(JSON.stringify({ nodes }, null, 2));
    setJsonError("");
    setMode("json");
  };
  const switchToForm = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!isFlow(parsed)) throw new Error("nodes配列が必要です");
      setNodes(parsed.nodes);
      setJsonError("");
      setMode("form");
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "JSONの形式が正しくありません");
    }
  };

  const currentFlowJson = (): Flow | null => {
    if (mode === "form") return { nodes };
    try {
      const parsed = JSON.parse(jsonText);
      if (!isFlow(parsed)) throw new Error("nodes配列が必要です");
      return parsed;
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : "JSONの形式が正しくありません");
      return null;
    }
  };

  const handleCreateVersion = async () => {
    const res = await fetch("/api/chatbot/admin/flow-versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId }),
    });
    if (res.ok) load();
  };

  const handleSaveDraft = async (): Promise<boolean> => {
    const draftJson = currentFlowJson();
    if (!draftJson) return false;
    if (!selectedId) {
      await handleCreateVersion();
      return false;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/chatbot/admin/flow-versions/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftJson }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error([json.error, ...(json.details ?? [])].filter(Boolean).join(" / "));
      setMessage("下書きを保存しました");
      load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      return false;
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
      const saved = await handleSaveDraft();
      if (!saved) return;
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
        description="公開を押すまで、編集中の下書きは公開中のチャットボットに反映されません。応募導線（メール／LINE／外部フォーム／電話）は分岐ごとに個別に設定できます。"
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {versions.length > 0 && (
          <>
            <select
              value={selectedId ?? ""}
              onChange={(e) => {
                const v = versions.find((ver) => ver.id === e.target.value);
                setSelectedId(e.target.value);
                applyLoadedFlow(v?.draftJson);
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-auto max-w-[220px] flex-none"
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
          </>
        )}
        <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-full p-1">
          <button
            onClick={() => mode !== "form" && switchToForm()}
            className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            style={mode === "form" ? { backgroundColor: "white", color: "#A85E74" } : { color: "#6b7280" }}
          >
            フォーム編集
          </button>
          <button
            onClick={() => mode !== "json" && switchToJson()}
            className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            style={mode === "json" ? { backgroundColor: "white", color: "#A85E74" } : { color: "#6b7280" }}
          >
            JSON編集
          </button>
        </div>
      </div>

      {mode === "form" ? (
        <FlowEditor nodes={nodes} onChange={setNodes} />
      ) : (
        <div className="card-luxury p-5">
          {jsonError && <p className="text-red-500 text-xs mb-2">{jsonError}</p>}
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono"
          />
        </div>
      )}

      <div className="card-luxury p-5 mt-4 flex items-center gap-3">
        <button
          onClick={() => handleSaveDraft()}
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
          <span className="text-xs text-gray-400">最終公開: {new Date(selected.publishedAt).toLocaleString("ja-JP")}</span>
        )}
      </div>
    </div>
  );
}
