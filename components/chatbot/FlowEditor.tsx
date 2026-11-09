"use client";

import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { APPLY_ACTION_METHOD_LABEL, ApplyActionMethod, FLOW_NODE_TYPE_LABEL, FlowNode, FlowNodeType } from "@/components/chatbot/types";

interface FlowEditorProps {
  nodes: FlowNode[];
  onChange: (nodes: FlowNode[]) => void;
}

function genNodeId(existing: FlowNode[]): string {
  let id: string;
  do {
    id = `node_${Math.random().toString(36).slice(2, 8)}`;
  } while (existing.some((n) => n.id === id));
  return id;
}

function defaultsForType(type: FlowNodeType): Partial<FlowNode> {
  switch (type) {
    case "apply_action":
      return { method: "email", fields: { askDesiredPosition: true, askEmploymentType: true } };
    case "choice":
      return { options: [] };
    default:
      return {};
  }
}

const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm";
const labelClass = "block text-xs text-gray-500 mb-1.5";

export default function FlowEditor({ nodes, onChange }: FlowEditorProps) {
  const updateNode = (id: string, patch: Partial<FlowNode>) => {
    onChange(nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const removeNode = (id: string) => {
    onChange(nodes.filter((n) => n.id !== id));
  };

  const addNode = () => {
    const id = genNodeId(nodes);
    onChange([...nodes, { id, type: "notice", text: "", ...defaultsForType("notice") }]);
  };

  const nextNodeOptions = (currentId: string) => (
    <>
      <option value="">（未設定）</option>
      {nodes
        .filter((n) => n.id !== currentId)
        .map((n) => (
          <option key={n.id} value={n.id}>
            {n.id}（{FLOW_NODE_TYPE_LABEL[n.type]}）
          </option>
        ))}
    </>
  );

  return (
    <div className="space-y-4">
      {nodes.map((node) => (
        <div key={node.id} className="card-luxury p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono px-2 py-1 rounded bg-gray-100 text-gray-600">{node.id}</code>
              <div className="relative">
                <select
                  value={node.type}
                  onChange={(e) => {
                    const type = e.target.value as FlowNodeType;
                    updateNode(node.id, { type, ...defaultsForType(type) });
                  }}
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-gray-200 text-sm font-medium bg-white"
                >
                  {Object.entries(FLOW_NODE_TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
            <button onClick={() => removeNode(node.id)} className="text-gray-400 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>

          {node.type === "start" && (
            <label className="block">
              <span className={labelClass}>最初に進むノード</span>
              <select
                value={node.nextNodeId ?? ""}
                onChange={(e) => updateNode(node.id, { nextNodeId: e.target.value || undefined })}
                className={inputClass}
              >
                {nextNodeOptions(node.id)}
              </select>
            </label>
          )}

          {(node.type === "notice" || node.type === "text_input") && (
            <div className="space-y-3">
              <label className="block">
                <span className={labelClass}>{node.type === "notice" ? "案内文" : "質問文"}</span>
                <textarea
                  value={node.text ?? ""}
                  onChange={(e) => updateNode(node.id, { text: e.target.value })}
                  rows={2}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>次に進むノード</span>
                <select
                  value={node.nextNodeId ?? ""}
                  onChange={(e) => updateNode(node.id, { nextNodeId: e.target.value || undefined })}
                  className={inputClass}
                >
                  {nextNodeOptions(node.id)}
                </select>
              </label>
            </div>
          )}

          {node.type === "choice" && (
            <div className="space-y-3">
              <label className="block">
                <span className={labelClass}>質問文</span>
                <textarea
                  value={node.text ?? ""}
                  onChange={(e) => updateNode(node.id, { text: e.target.value })}
                  rows={2}
                  className={inputClass}
                />
              </label>
              <div>
                <span className={labelClass}>選択肢</span>
                <div className="space-y-2">
                  {(node.options ?? []).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.label}
                        placeholder="選択肢のラベル"
                        onChange={(e) => {
                          const options = [...(node.options ?? [])];
                          options[i] = { ...options[i], label: e.target.value };
                          updateNode(node.id, { options });
                        }}
                        className={`${inputClass} flex-1`}
                      />
                      <select
                        value={opt.nextNodeId}
                        onChange={(e) => {
                          const options = [...(node.options ?? [])];
                          options[i] = { ...options[i], nextNodeId: e.target.value };
                          updateNode(node.id, { options });
                        }}
                        className={`${inputClass} flex-1`}
                      >
                        {nextNodeOptions(node.id)}
                      </select>
                      <button
                        onClick={() => {
                          const options = (node.options ?? []).filter((_, idx) => idx !== i);
                          updateNode(node.id, { options });
                        }}
                        className="text-gray-400 hover:text-red-500 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateNode(node.id, { options: [...(node.options ?? []), { label: "", nextNodeId: "" }] })}
                    className="text-xs font-medium text-[#A85E74] inline-flex items-center gap-1"
                  >
                    <Plus size={14} />
                    選択肢を追加
                  </button>
                </div>
              </div>
            </div>
          )}

          {node.type === "apply_action" && (
            <div className="space-y-3">
              <label className="block">
                <span className={labelClass}>案内文（任意）</span>
                <textarea
                  value={node.text ?? ""}
                  onChange={(e) => updateNode(node.id, { text: e.target.value })}
                  rows={2}
                  placeholder="例：ぜひお気軽にご連絡ください"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>応募導線の種類</span>
                <select
                  value={node.method ?? "email"}
                  onChange={(e) => updateNode(node.id, { method: e.target.value as ApplyActionMethod })}
                  className={inputClass}
                >
                  {Object.entries(APPLY_ACTION_METHOD_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {node.method === "email" && (
                <div className="flex flex-wrap gap-4 pt-1">
                  {(
                    [
                      ["askDesiredPosition", "希望職種を尋ねる"],
                      ["askEmploymentType", "雇用形態を尋ねる"],
                      ["askPhone", "電話番号を尋ねる"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={!!node.fields?.[key]}
                        onChange={(e) => updateNode(node.id, { fields: { ...node.fields, [key]: e.target.checked } })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}

              {node.method === "line" && (
                <label className="block">
                  <span className={labelClass}>LINE公式アカウントのURL</span>
                  <input
                    type="text"
                    value={node.lineUrl ?? ""}
                    onChange={(e) => updateNode(node.id, { lineUrl: e.target.value })}
                    placeholder="https://lin.ee/..."
                    className={inputClass}
                  />
                </label>
              )}

              {node.method === "external_form" && (
                <label className="block">
                  <span className={labelClass}>外部応募フォームのURL</span>
                  <input
                    type="text"
                    value={node.externalFormUrl ?? ""}
                    onChange={(e) => updateNode(node.id, { externalFormUrl: e.target.value })}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </label>
              )}

              {node.method === "phone" && (
                <label className="block">
                  <span className={labelClass}>電話番号</span>
                  <input
                    type="text"
                    value={node.phoneNumber ?? ""}
                    onChange={(e) => updateNode(node.id, { phoneNumber: e.target.value })}
                    placeholder="03-1234-5678"
                    className={inputClass}
                  />
                </label>
              )}
            </div>
          )}

          {node.type === "end" && <p className="text-xs text-gray-400">このノードに到達するとチャットを終了します。</p>}
        </div>
      ))}

      <button
        onClick={addNode}
        className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-[#C4788A] hover:text-[#A85E74] transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={16} />
        ノードを追加
      </button>
    </div>
  );
}
