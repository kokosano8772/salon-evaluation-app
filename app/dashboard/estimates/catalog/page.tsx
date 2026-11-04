"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CatalogItem, Template, formatYen, groupByCategory } from "@/components/estimates/types";

type Tab = "catalog" | "templates";

const EMPTY_ITEM_FORM = {
  category: "",
  subcategory: "",
  name: "",
  description: "",
  unit: "式",
  unitPrice: 0,
  // 公式ライン登録・HP管理企業様は、基本作業料からの「割引額」で入力する
  // （最終単価を直接入力すると何円引かれているか分かりにくいため）。
  discountLineRegistered: "" as number | "",
  discountHpManaged: "" as number | "",
};

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

function groupByCategoryAndSub(items: CatalogItem[]): { category: string; subGroups: { subcategory: string; items: CatalogItem[] }[] }[] {
  const catGroups = groupByCategory(items);
  return catGroups.map((g) => ({
    category: g.category,
    subGroups: groupByCategory(g.items.map((i) => ({ ...i, category: i.subcategory || "その他" }))).map((s) => ({
      subcategory: s.category,
      items: s.items,
    })),
  }));
}

function CatalogTab({ items, onChanged }: { items: CatalogItem[]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_ITEM_FORM);
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => groupByCategoryAndSub(items), [items]);

  const startAdd = () => {
    setForm(EMPTY_ITEM_FORM);
    setEditingId(null);
    setAdding(true);
  };

  const startEdit = (item: CatalogItem) => {
    setForm({
      category: item.category,
      subcategory: item.subcategory,
      name: item.name,
      description: item.description,
      unit: item.unit,
      unitPrice: item.unitPrice,
      discountLineRegistered: item.unitPriceLineRegistered === null ? "" : item.unitPrice - item.unitPriceLineRegistered,
      discountHpManaged: item.unitPriceHpManaged === null ? "" : item.unitPrice - item.unitPriceHpManaged,
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
      const payload = {
        category: form.category,
        subcategory: form.subcategory,
        name: form.name,
        description: form.description,
        unit: form.unit,
        unitPrice: form.unitPrice,
        unitPriceLineRegistered: form.discountLineRegistered === "" ? null : form.unitPrice - form.discountLineRegistered,
        unitPriceHpManaged: form.discountHpManaged === "" ? null : form.unitPrice - form.discountHpManaged,
      };
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          placeholder="大分類（例: 印刷物制作）"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
        />
        <input
          type="text"
          value={form.subcategory}
          onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
          placeholder="中分類（例: チラシ・フライヤー）"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
        />
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="項目名"
          className="sm:col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
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
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] text-gray-400 mb-1">基本作業料（円）</label>
          <input
            type="number"
            value={form.unitPrice}
            onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
          />
        </div>
        <div>
          <label className="block text-[11px] text-gray-400 mb-1">公式ライン登録（基本料金からの割引額・任意）</label>
          <input
            type="number"
            value={form.discountLineRegistered}
            onChange={(e) => setForm({ ...form, discountLineRegistered: e.target.value === "" ? "" : Number(e.target.value) })}
            placeholder="割引なしなら空欄"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
          />
          {form.discountLineRegistered !== "" && (
            <p className="text-[11px] text-gray-400 mt-1">→ {formatYen(form.unitPrice - form.discountLineRegistered)}</p>
          )}
        </div>
        <div>
          <label className="block text-[11px] text-gray-400 mb-1">HP管理企業様（基本料金からの割引額・任意）</label>
          <input
            type="number"
            value={form.discountHpManaged}
            onChange={(e) => setForm({ ...form, discountHpManaged: e.target.value === "" ? "" : Number(e.target.value) })}
            placeholder="割引なしなら空欄"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
          />
          {form.discountHpManaged !== "" && (
            <p className="text-[11px] text-gray-400 mt-1">→ {formatYen(form.unitPrice - form.discountHpManaged)}</p>
          )}
        </div>
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
          {groups.map((catGroup) => (
            <div key={catGroup.category} className="card-luxury overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-charcoal-700">{catGroup.category}</p>
              </div>
              {catGroup.subGroups.map((subGroup) => (
                <div key={subGroup.subcategory}>
                  <div className="px-5 py-2 bg-gray-50/50 border-b border-gray-50">
                    <p className="text-[11px] font-medium text-gray-400">{subGroup.subcategory}</p>
                  </div>
                  {subGroup.items.map((item) =>
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
                        <div className="text-right shrink-0">
                          <p className="text-sm text-gray-700">{formatYen(item.unitPrice)}</p>
                          {(item.unitPriceLineRegistered !== null || item.unitPriceHpManaged !== null) && (
                            <p className="text-[11px] text-gray-400">
                              {item.unitPriceLineRegistered !== null &&
                                `ライン:${formatYen(item.unitPriceLineRegistered)}(-${formatYen(item.unitPrice - item.unitPriceLineRegistered)})`}
                              {item.unitPriceLineRegistered !== null && item.unitPriceHpManaged !== null && " / "}
                              {item.unitPriceHpManaged !== null &&
                                `HP管理:${formatYen(item.unitPriceHpManaged)}(-${formatYen(item.unitPrice - item.unitPriceHpManaged)})`}
                            </p>
                          )}
                        </div>
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
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// プリセット編集用の項目選択。プリセットは常に「基本作業料」区分の単価を使う前提
// （見積もりビルダー側のhandleApplyTemplateと同じ約束）なので、ここでは料金区分の
// 選択は出さず、チェックボックス＋数量のシンプルな一覧にする。
function TemplateItemPicker({
  catalogItems,
  selected,
  onToggle,
  onQuantityChange,
}: {
  catalogItems: CatalogItem[];
  selected: Map<string, number>;
  onToggle: (item: CatalogItem) => void;
  onQuantityChange: (catalogItemId: string, quantity: number) => void;
}) {
  const groups = useMemo(() => groupByCategoryAndSub(catalogItems.filter((i) => i.isActive)), [catalogItems]);

  return (
    <div className="space-y-4">
      {groups.map((catGroup) => (
        <div key={catGroup.category} className="card-luxury overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-charcoal-700">{catGroup.category}</p>
          </div>
          {catGroup.subGroups.map((subGroup) => (
            <div key={subGroup.subcategory}>
              <div className="px-5 py-2 bg-gray-50/50 border-b border-gray-50">
                <p className="text-[11px] font-medium text-gray-400">{subGroup.subcategory}</p>
              </div>
              {subGroup.items.map((item) => {
                const quantity = selected.get(item.id);
                const isChecked = quantity !== undefined;
                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 px-5 py-2.5 border-b border-gray-50 last:border-0 cursor-pointer ${
                      isChecked ? "bg-[#C4788A0D]" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggle(item)}
                      className="w-4 h-4 accent-[#C4788A] shrink-0"
                    />
                    <span className="text-sm text-charcoal-900 flex-1 min-w-0 truncate">{item.name}</span>
                    <span className="text-xs text-gray-400 shrink-0">{formatYen(item.unitPrice)}</span>
                    {isChecked && (
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onClick={(e) => e.preventDefault()}
                        onChange={(e) => onQuantityChange(item.id, Math.max(1, Math.round(Number(e.target.value)) || 1))}
                        className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-sm text-right outline-none focus:border-[#C4788A] shrink-0"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      ))}
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

        <TemplateItemPicker
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
