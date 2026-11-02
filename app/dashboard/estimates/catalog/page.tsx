"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CatalogChecklist from "@/components/estimates/CatalogChecklist";
import { CatalogItem, Template, formatYen } from "@/components/estimates/types";

type Tab = "catalog" | "templates";

const EMPTY_ITEM_FORM = { category: "", name: "", description: "", unit: "式", unitPrice: 0, sortOrder: 0 };

export default function EstimateCatalogPage() {
  const [tab, setTab] = useState<Tab>("catalog");
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshCatalog = () => {
    fetch("/api/estimates/catalog-items?includeInactive=1")
      .then((r) => r.json())
      .then((json) => setCatalogItems(json.items ?? []));
  };
  const refreshTemplates = () => {
    fetch("/api/estimates/templates?includeInactive=1")
      .then((r) => r.json())
      .then((json) => setTemplates(json.templates ?? []));
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/estimates/catalog-items?includeInactive=1").then((r) => r.json()),
      fetch("/api/estimates/templates?includeInactive=1").then((r) => r.json()),
    ])
      .then(([catalogRes, templatesRes]) => {
        setCatalogItems(catalogRes.items ?? []);
        setTemplates(templatesRes.templates ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <DashboardHeader
        title="価格表・プリセット管理"
        description="見積もりビルダーで選べる項目と、よく使う組み合わせ（プリセット）を管理します。"
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "見積もり一覧", href: "/dashboard/estimates" },
          { label: "価格表・プリセット管理" },
        ]}
      />

      <div className="flex items-center gap-2 mb-6">
        {(
          [
            { id: "catalog" as const, label: "価格表" },
            { id: "templates" as const, label: "プリセット" },
          ]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="text-sm font-medium px-4 py-2 rounded-full border transition-colors"
            style={
              tab === t.id
                ? { backgroundColor: "#C4788A14", color: "#A85E74", borderColor: "#C4788A55" }
                : { backgroundColor: "white", color: "#6b7280", borderColor: "#e5e7eb" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />
      ) : error ? (
        <div className="card-luxury p-12 text-center text-gray-400 text-sm">{error}</div>
      ) : tab === "catalog" ? (
        <CatalogTab items={catalogItems} onChanged={refreshCatalog} />
      ) : (
        <TemplatesTab templates={templates} catalogItems={catalogItems} onChanged={refreshTemplates} />
      )}
    </div>
  );
}

function groupByCategory(items: CatalogItem[]): { category: string; items: CatalogItem[] }[] {
  const groups: { category: string; items: CatalogItem[] }[] = [];
  const indexByCategory = new Map<string, number>();
  for (const item of items) {
    const key = item.category || "その他";
    if (!indexByCategory.has(key)) {
      indexByCategory.set(key, groups.length);
      groups.push({ category: key, items: [] });
    }
    groups[indexByCategory.get(key)!].items.push(item);
  }
  return groups;
}

function CatalogTab({ items, onChanged }: { items: CatalogItem[]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_ITEM_FORM);
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => groupByCategory(items), [items]);

  const startAdd = () => {
    setForm(EMPTY_ITEM_FORM);
    setEditingId(null);
    setAdding(true);
  };

  const startEdit = (item: CatalogItem) => {
    setForm({
      category: item.category,
      name: item.name,
      description: item.description,
      unit: item.unit,
      unitPrice: item.unitPrice,
      sortOrder: item.sortOrder,
    });
    setAdding(false);
    setEditingId(item.id);
  };

  const cancel = () => {
    setAdding(false);
    setEditingId(null);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      alert("項目名が必要です");
      return;
    }
    setBusy(true);
    try {
      const url = editingId ? `/api/estimates/catalog-items/${editingId}` : "/api/estimates/catalog-items";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存に失敗しました");
      cancel();
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (item: CatalogItem) => {
    const res = await fetch(`/api/estimates/catalog-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error ?? "更新に失敗しました");
      return;
    }
    onChanged();
  };

  const formCard = (
    <div className="card-luxury p-5 mb-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="カテゴリ（例: ホームページ制作）"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
        />
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="項目名"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
        />
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="説明（任意）"
          className="sm:col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
        />
        <input
          type="text"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          placeholder="単位（例: 式・ページ・月）"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
        />
        <input
          type="number"
          value={form.unitPrice}
          onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) || 0 })}
          placeholder="単価（円）"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={busy}
          onClick={submit}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          {busy ? "保存中..." : "保存"}
        </button>
        <button onClick={cancel} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200">
          キャンセル
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {!adding && !editingId && (
        <button
          onClick={startAdd}
          className="flex items-center gap-1.5 mb-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          <Plus size={15} strokeWidth={2.5} />
          項目を追加
        </button>
      )}
      {adding && formCard}

      {items.length === 0 && !adding ? (
        <div className="card-luxury p-12 text-center text-gray-400 text-sm">まだ価格表に項目がありません。</div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.category} className="card-luxury overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-charcoal-700">{group.category}</p>
              </div>
              <div>
                {group.items.map((item) =>
                  editingId === item.id ? (
                    <div key={item.id} className="p-5 border-b border-gray-50 last:border-0">
                      {formCard}
                    </div>
                  ) : (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-50 last:border-0 ${
                        !item.isActive ? "opacity-50" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-charcoal-900">
                          {item.name}
                          {!item.isActive && (
                            <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
                              非公開
                            </span>
                          )}
                        </p>
                        {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                      </div>
                      <p className="text-sm text-gray-500 shrink-0">
                        {formatYen(item.unitPrice)} / {item.unit}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => startEdit(item)}
                          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-charcoal-600 hover:bg-gray-50"
                        >
                          <Pencil size={13} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => toggleActive(item)}
                          title={item.isActive ? "非公開にする" : "公開する"}
                          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                        >
                          {item.isActive ? <Trash2 size={13} strokeWidth={2} /> : <Plus size={13} strokeWidth={2} />}
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplatesTab({
  templates,
  catalogItems,
  onChanged,
}: {
  templates: Template[];
  catalogItems: CatalogItem[];
  onChanged: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Map<string, number>>(new Map());
  const [busy, setBusy] = useState(false);

  const startCreate = () => {
    setName("");
    setDescription("");
    setSelected(new Map());
    setEditingId(null);
    setCreating(true);
  };

  const startEdit = (t: Template) => {
    setName(t.name);
    setDescription(t.description);
    setSelected(new Map(t.items.map((it) => [it.catalogItemId, it.defaultQuantity])));
    setCreating(false);
    setEditingId(t.id);
  };

  const cancel = () => {
    setCreating(false);
    setEditingId(null);
  };

  const handleToggle = (item: CatalogItem) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.set(item.id, 1);
      return next;
    });
  };
  const handleQuantityChange = (catalogItemId: string, quantity: number) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(catalogItemId, quantity);
      return next;
    });
  };

  const submit = async () => {
    if (!name.trim()) {
      alert("プリセット名が必要です");
      return;
    }
    if (selected.size === 0) {
      alert("項目を1つ以上選択してください");
      return;
    }
    setBusy(true);
    try {
      const items = Array.from(selected.entries()).map(([catalogItemId, defaultQuantity]) => ({
        catalogItemId,
        defaultQuantity,
      }));
      const url = editingId ? `/api/estimates/templates/${editingId}` : "/api/estimates/templates";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, items }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存に失敗しました");
      cancel();
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このプリセットを削除しますか？")) return;
    const res = await fetch(`/api/estimates/templates/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error ?? "削除に失敗しました");
      return;
    }
    onChanged();
  };

  if (creating || editingId) {
    return (
      <div className="space-y-4">
        <div className="card-luxury p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">プリセット情報</p>
            <button onClick={cancel} className="text-gray-400 hover:text-gray-600">
              <X size={16} strokeWidth={2} />
            </button>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="プリセット名（例: 美容室HP制作スタンダード）"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="説明（任意）"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
          />
        </div>

        <CatalogChecklist
          catalogItems={catalogItems}
          selected={selected}
          onToggle={handleToggle}
          onQuantityChange={handleQuantityChange}
        />

        <div className="flex items-center gap-2">
          <button
            disabled={busy}
            onClick={submit}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            {busy ? "保存中..." : "プリセットを保存"}
          </button>
          <button onClick={cancel} className="px-5 py-3 rounded-xl text-sm font-medium text-gray-500 border border-gray-200">
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={startCreate}
        className="flex items-center gap-1.5 mb-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
      >
        <Plus size={15} strokeWidth={2.5} />
        プリセットを作成
      </button>

      {templates.length === 0 ? (
        <div className="card-luxury p-12 text-center text-gray-400 text-sm">まだプリセットがありません。</div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="card-luxury p-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-charcoal-900">
                  {t.name}
                  {!t.isActive && (
                    <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">非公開</span>
                  )}
                </p>
                {t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
                <p className="text-xs text-gray-400 mt-0.5">{t.items.length}項目</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => startEdit(t)}
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-charcoal-600 hover:bg-gray-50"
                >
                  <Pencil size={13} strokeWidth={2} />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
