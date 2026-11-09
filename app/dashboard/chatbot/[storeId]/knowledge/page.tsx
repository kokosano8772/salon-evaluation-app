"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, Trash2, Plus, UploadCloud } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { ITEM_TYPE_LABEL, KnowledgeItem, KnowledgeItemType } from "@/components/chatbot/types";

const EMPTY_FORM = { itemType: "faq" as KnowledgeItemType, category: "", title: "", body: "" };

export default function ChatbotKnowledgePage() {
  const params = useParams<{ storeId: string }>();
  const router = useRouter();
  const storeId = params.storeId;
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Record<string, { title: string; body: string; category: string }>>({});

  const load = () => {
    fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-items`)
      .then((r) => r.json())
      .then((json) => setItems(json.items ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [storeId]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "追加に失敗しました");
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  const draftOf = (item: KnowledgeItem) => editing[item.id] ?? { title: item.title, body: item.body, category: item.category };

  const handleSaveDraft = async (item: KnowledgeItem) => {
    const d = draftOf(item);
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    });
    load();
  };

  const handlePublish = async (item: KnowledgeItem) => {
    await handleSaveDraft(item);
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-items/${item.id}/publish`, { method: "POST" });
    load();
  };

  const handleUnpublish = async (item: KnowledgeItem) => {
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: false }),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この項目を削除しますか？")) return;
    await fetch(`/api/chatbot/admin/bots/${storeId}/knowledge-items/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <DashboardHeader
        title="求人情報・FAQ"
        description="公開ボタンを押すまで、編集した内容は公開中のチャットボットには反映されません。"
        actions={
          <button
            onClick={() => router.push(`/dashboard/chatbot/${storeId}/knowledge/sources`)}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-charcoal-700"
          >
            取得元URLを管理
          </button>
        }
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "求人チャットボット", href: "/dashboard/chatbot" },
          { label: storeId, href: `/dashboard/chatbot/${storeId}` },
          { label: "求人情報・FAQ" },
        ]}
      />

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="card-luxury p-5 mb-6 space-y-3">
        <h3 className="text-sm font-bold text-charcoal-900">新規項目を追加</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={form.itemType}
              onChange={(e) => setForm({ ...form, itemType: e.target.value as KnowledgeItemType })}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm bg-white"
            >
              {Object.entries(ITEM_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} strokeWidth={2} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <input
            type="text"
            placeholder="カテゴリ（任意）"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
          />
          <input
            type="text"
            placeholder="タイトル（例: 給与について）"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm sm:col-span-2"
          />
          <textarea
            placeholder="本文"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={3}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm sm:col-span-2"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={creating || !form.title.trim()}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          <Plus size={16} />
          追加
        </button>
      </div>

      {loading ? (
        <div className="card-luxury p-12 h-48 animate-pulse bg-gray-50" />
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const d = draftOf(item);
            const hasUnpublishedChanges = item.isPublished && (d.title !== item.title || d.body !== item.body);
            return (
              <div key={item.id} className="card-luxury p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {ITEM_TYPE_LABEL[item.itemType]}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.isPublished ? (
                      <span className="text-xs text-green-600 font-medium">公開中</span>
                    ) : (
                      <span className="text-xs text-gray-400">未公開</span>
                    )}
                    <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={d.title}
                  onChange={(e) => setEditing({ ...editing, [item.id]: { ...d, title: e.target.value } })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium mb-2"
                />
                <textarea
                  value={d.body}
                  onChange={(e) => setEditing({ ...editing, [item.id]: { ...d, body: e.target.value } })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-3"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSaveDraft(item)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-charcoal-700"
                  >
                    下書き保存
                  </button>
                  <button
                    onClick={() => handlePublish(item)}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                    style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
                  >
                    <UploadCloud size={14} />
                    公開する
                  </button>
                  {item.isPublished && (
                    <button
                      onClick={() => handleUnpublish(item)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500"
                    >
                      公開を取り下げる
                    </button>
                  )}
                  {hasUnpublishedChanges && <span className="text-xs text-amber-600">※未公開の変更あり</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
