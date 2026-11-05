"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { NotificationContact } from "@/components/chatbot/types";

export default function ChatbotNotificationsPage() {
  const params = useParams<{ storeId: string }>();
  const storeId = params.storeId;
  const [contacts, setContacts] = useState<NotificationContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () => {
    fetch(`/api/chatbot/admin/bots/${storeId}/notifications`)
      .then((r) => r.json())
      .then((json) => setContacts(json.contacts ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [storeId]);

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch(`/api/chatbot/admin/bots/${storeId}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, name: newName, isPrimary: contacts.length === 0 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "追加に失敗しました");
      setNewEmail("");
      setNewName("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdate = async (id: string, patch: Partial<NotificationContact>) => {
    await fetch(`/api/chatbot/admin/bots/${storeId}/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この通知先を削除しますか？")) return;
    await fetch(`/api/chatbot/admin/bots/${storeId}/notifications/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <DashboardHeader
        title="通知先メール"
        description="応募内容はここに登録したメールアドレスへ直送します（自社データベースには保存しません）。"
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "求人チャットボット", href: "/dashboard/chatbot" },
          { label: storeId, href: `/dashboard/chatbot/${storeId}` },
          { label: "通知先メール" },
        ]}
      />

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="card-luxury p-5 mb-6 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1.5">メールアドレス</span>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-64"
          />
        </label>
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1.5">担当者名（任意）</span>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-48"
          />
        </label>
        <button
          onClick={handleAdd}
          disabled={adding || !newEmail.trim()}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          <Plus size={16} />
          追加
        </button>
      </div>

      {loading ? (
        <div className="card-luxury p-12 h-32 animate-pulse bg-gray-50" />
      ) : (
        <div className="card-luxury divide-y divide-gray-100">
          {contacts.length === 0 && <p className="p-5 text-sm text-gray-400">通知先が未登録です。</p>}
          {contacts.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-charcoal-900">
                  {c.email} {c.isPrimary && <span className="text-xs text-[#C4788A] ml-1">主担当</span>}
                </p>
                <p className="text-xs text-gray-400">{c.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={c.isActive}
                    onChange={(e) => handleUpdate(c.id, { isActive: e.target.checked })}
                  />
                  有効
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={c.isPrimary}
                    onChange={(e) => handleUpdate(c.id, { isPrimary: e.target.checked })}
                  />
                  主担当
                </label>
                <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
