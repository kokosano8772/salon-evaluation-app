"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FormSection from "@/components/growth-db/forms/FormSection";
import CatalogChecklist from "./CatalogChecklist";
import PresetButtons from "./PresetButtons";
import StickyTotalBar from "./StickyTotalBar";
import StoreOrClientPicker from "./StoreOrClientPicker";
import { CatalogItem, LineItem, StoreOption, Template } from "./types";

interface EstimateBuilderInitial {
  title: string;
  notes: string;
  validUntil: string | null;
  taxRate: number;
  storeId: string | null;
  clientName: string;
  clientContact: string;
  lineItems: LineItem[];
}

interface EstimateBuilderProps {
  mode: "new" | "edit";
  estimateId?: string;
  initial?: EstimateBuilderInitial;
}

export default function EstimateBuilder({ mode, estimateId, initial }: EstimateBuilderProps) {
  const router = useRouter();
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<Map<string, number>>(() => {
    const map = new Map<string, number>();
    for (const li of initial?.lineItems ?? []) {
      if (li.catalogItemId) map.set(li.catalogItemId, li.quantity);
    }
    return map;
  });
  const [pickerMode, setPickerMode] = useState<"store" | "client">(initial?.storeId ? "store" : "client");
  const [storeId, setStoreId] = useState<string | null>(initial?.storeId ?? null);
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [clientContact, setClientContact] = useState(initial?.clientContact ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [validUntil, setValidUntil] = useState(initial?.validUntil ?? "");
  const [taxRate] = useState(initial?.taxRate ?? 0.1);

  useEffect(() => {
    // 編集時は、すでに非公開化された価格表項目を参照している明細があっても
    // 正しく表示・金額計算できるよう、非公開項目も含めて取得する。
    const catalogUrl = mode === "edit" ? "/api/estimates/catalog-items?includeInactive=1" : "/api/estimates/catalog-items";
    Promise.all([
      fetch(catalogUrl).then((r) => r.json()),
      fetch("/api/estimates/templates").then((r) => r.json()),
      fetch("/api/estimates/stores").then((r) => r.json()),
    ])
      .then(([catalogRes, templatesRes, storesRes]) => {
        setCatalogItems(catalogRes.items ?? []);
        setTemplates(templatesRes.templates ?? []);
        setStores(storesRes.stores ?? []);
      })
      .finally(() => setLoading(false));
  }, [mode]);

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

  // プリセット適用は現在の選択への追加。すでにチェック済みの項目は上書きしない
  // （数量を個別調整済みの場合に失わないため）。非公開化された項目はスキップする。
  const handleApplyTemplate = (template: Template) => {
    setSelected((prev) => {
      const next = new Map(prev);
      for (const item of template.items) {
        if (!item.catalogItemIsActive) continue;
        if (!next.has(item.catalogItemId)) next.set(item.catalogItemId, item.defaultQuantity);
      }
      return next;
    });
  };

  const catalogItemById = useMemo(() => new Map(catalogItems.map((c) => [c.id, c])), [catalogItems]);

  const { subtotal, taxAmount, total } = useMemo(() => {
    let sum = 0;
    selected.forEach((qty, id) => {
      const item = catalogItemById.get(id);
      if (item) sum += item.unitPrice * qty;
    });
    const tax = Math.round(sum * taxRate);
    return { subtotal: sum, taxAmount: tax, total: sum + tax };
  }, [selected, catalogItemById, taxRate]);

  const handleSave = async () => {
    setError("");
    if (!title.trim()) {
      setError("件名を入力してください");
      return;
    }
    if (pickerMode === "client" && !clientName.trim()) {
      setError("クライアント名を入力してください");
      return;
    }
    if (pickerMode === "store" && !storeId) {
      setError("クライアントを選択してください");
      return;
    }
    if (selected.size === 0) {
      setError("明細を1件以上選択してください");
      return;
    }

    setSaving(true);
    try {
      const lineItems = Array.from(selected.entries()).map(([catalogItemId, quantity]) => ({
        catalogItemId,
        quantity,
      }));
      const body = {
        storeId: pickerMode === "store" ? storeId : null,
        clientName: pickerMode === "client" ? clientName : "",
        clientContact,
        title,
        notes,
        validUntil: validUntil || null,
        taxRate,
        lineItems,
      };

      const res = await fetch(mode === "new" ? "/api/estimates" : `/api/estimates/${estimateId}`, {
        method: mode === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存に失敗しました");

      const nextId = mode === "new" ? json.id : estimateId;
      router.push(`/dashboard/estimates/${nextId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-luxury p-5 h-24 animate-pulse bg-gray-50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {error && <div className="card-luxury p-4 text-sm text-red-500 border border-red-200">{error}</div>}

      <FormSection title="見積もり情報">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">件名</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: ホームページリニューアル一式"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">見積有効期限（任意）</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">備考（任意）</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A] resize-none"
          />
        </div>
      </FormSection>

      <StoreOrClientPicker
        mode={pickerMode}
        onModeChange={setPickerMode}
        stores={stores}
        storeId={storeId}
        clientName={clientName}
        clientContact={clientContact}
        onChangeStoreId={setStoreId}
        onChangeClientName={setClientName}
        onChangeClientContact={setClientContact}
      />

      <PresetButtons templates={templates} onApply={handleApplyTemplate} />

      <CatalogChecklist
        catalogItems={catalogItems}
        selected={selected}
        onToggle={handleToggle}
        onQuantityChange={handleQuantityChange}
      />

      <StickyTotalBar
        itemCount={selected.size}
        subtotal={subtotal}
        taxRate={taxRate}
        taxAmount={taxAmount}
        total={total}
        onSave={handleSave}
        saving={saving}
        saveLabel={mode === "new" ? "見積もりを保存" : "変更を保存"}
      />
    </div>
  );
}
