"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FormSection from "@/components/growth-db/forms/FormSection";
import CatalogChecklist from "./CatalogChecklist";
import PresetButtons from "./PresetButtons";
import SelectedLinesCart from "./SelectedLinesCart";
import StickyTotalBar from "./StickyTotalBar";
import StoreOrClientPicker from "./StoreOrClientPicker";
import {
  CartLine,
  CatalogItem,
  LineItem,
  LineItemPayload,
  PRICE_TIER_DISCOUNT_LABEL,
  PriceTier,
  StoreOption,
  Template,
  availableTiers,
} from "./types";

interface EstimateBuilderInitial {
  title: string;
  notes: string;
  productionDate: string | null;
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

function buildInitialCart(lineItems: LineItem[] | undefined): Map<string, CartLine> {
  const map = new Map<string, CartLine>();
  (lineItems ?? []).forEach((li, i) => {
    const key = li.id ?? `existing-${i}`;
    // priceTier: null は「価格表から選び直したものではなく、既存の明細をそのまま
    // 維持している」という意味。保存時はkeepSnapshotとして送り、価格表の現在値での
    // 再計算を行わない（編集のたびに無関係な行の単価が動いてしまうのを防ぐため）。
    map.set(key, {
      key,
      catalogItemId: li.catalogItemId,
      priceTier: null,
      category: li.category,
      name: li.name,
      description: li.description,
      unit: li.unit,
      unitPrice: li.unitPrice,
      procurementCost: li.procurementCost,
      discount: li.discountAmount,
      discountLabel: li.discountLabel,
      quantity: li.quantity,
    });
  });
  return map;
}

export default function EstimateBuilder({ mode, estimateId, initial }: EstimateBuilderProps) {
  const router = useRouter();
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [cart, setCart] = useState<Map<string, CartLine>>(() => buildInitialCart(initial?.lineItems));
  const [pickerMode, setPickerMode] = useState<"store" | "client">(initial?.storeId ? "store" : "client");
  const [storeId, setStoreId] = useState<string | null>(initial?.storeId ?? null);
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [clientContact, setClientContact] = useState(initial?.clientContact ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [productionDate, setProductionDate] = useState(initial?.productionDate ?? "");
  const [taxRate] = useState(initial?.taxRate ?? 0.1);

  useEffect(() => {
    Promise.all([
      fetch("/api/estimates/catalog-items").then((r) => r.json()),
      fetch("/api/estimates/templates").then((r) => r.json()),
      fetch("/api/estimates/stores").then((r) => r.json()),
    ])
      .then(([catalogRes, templatesRes, storesRes]) => {
        setCatalogItems(catalogRes.items ?? []);
        setTemplates(templatesRes.templates ?? []);
        setStores(storesRes.stores ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddFromCatalog = (item: CatalogItem, tier: PriceTier, quantity: number) => {
    const tiers = availableTiers(item);
    const tierInfo = tiers.find((t) => t.tier === tier) ?? tiers[0];
    const key = `${item.id}:${tierInfo.tier}`;
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      next.set(key, {
        key,
        catalogItemId: item.id,
        priceTier: tierInfo.tier,
        category: item.category,
        name: item.name,
        description: item.description,
        unit: item.unit,
        unitPrice: tierInfo.unitPrice,
        procurementCost: existing?.procurementCost ?? 0,
        discount: tierInfo.discount,
        discountLabel: PRICE_TIER_DISCOUNT_LABEL[tierInfo.tier],
        quantity: (existing?.quantity ?? 0) + quantity,
      });
      return next;
    });
  };

  const handleRemove = (key: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  };

  const handleQuantityChange = (key: string, quantity: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const line = next.get(key);
      if (line) next.set(key, { ...line, quantity });
      return next;
    });
  };

  const handleProcurementCostChange = (key: string, procurementCost: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const line = next.get(key);
      if (line) next.set(key, { ...line, procurementCost });
      return next;
    });
  };

  // プリセット適用は現在のカートへの追加。すでに同じ項目・料金区分がカートにある場合は
  // 上書きしない（数量を個別調整済みの場合に失わないため）。非公開化された項目はスキップ。
  // プリセットは常に「基本作業料」区分として適用する（プリセット自体に料金区分の概念を
  // 持たせていないため）。
  const handleApplyTemplate = (template: Template) => {
    setCart((prev) => {
      const next = new Map(prev);
      for (const item of template.items) {
        if (!item.catalogItemIsActive) continue;
        const key = `${item.catalogItemId}:standard`;
        if (next.has(key)) continue;
        next.set(key, {
          key,
          catalogItemId: item.catalogItemId,
          priceTier: "standard",
          category: item.category,
          name: item.name,
          description: "",
          unit: item.unit,
          unitPrice: item.unitPrice,
          procurementCost: 0,
          discount: 0,
          discountLabel: "",
          quantity: item.defaultQuantity,
        });
      }
      return next;
    });
  };

  const { subtotal, taxAmount, total } = useMemo(() => {
    let sum = 0;
    cart.forEach((line) => {
      sum += line.unitPrice * line.quantity + line.procurementCost;
    });
    const tax = Math.round(sum * taxRate);
    return { subtotal: sum, taxAmount: tax, total: sum + tax };
  }, [cart, taxRate]);

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
    if (cart.size === 0) {
      setError("明細を1件以上追加してください");
      return;
    }

    setSaving(true);
    try {
      const lineItems: LineItemPayload[] = Array.from(cart.values()).map((line) =>
        line.priceTier
          ? {
              catalogItemId: line.catalogItemId,
              priceTier: line.priceTier,
              quantity: line.quantity,
              procurementCost: line.procurementCost,
            }
          : {
              catalogItemId: line.catalogItemId,
              keepSnapshot: true,
              category: line.category,
              name: line.name,
              description: line.description,
              unit: line.unit,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              procurementCost: line.procurementCost,
              discountAmount: line.discount,
              discountLabel: line.discountLabel,
            }
      );
      const body = {
        storeId: pickerMode === "store" ? storeId : null,
        clientName: pickerMode === "client" ? clientName : "",
        clientContact,
        title,
        notes,
        productionDate: productionDate || null,
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
          <label className="block text-xs font-medium text-gray-500 mb-1.5">制作日（任意）</label>
          <input
            type="date"
            value={productionDate}
            onChange={(e) => setProductionDate(e.target.value)}
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

      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">選択中の明細</p>
        <SelectedLinesCart
          lines={Array.from(cart.values())}
          onRemove={handleRemove}
          onQuantityChange={handleQuantityChange}
          onProcurementCostChange={handleProcurementCostChange}
        />
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">価格表から追加</p>
        <CatalogChecklist catalogItems={catalogItems} onAdd={handleAddFromCatalog} />
      </div>

      <StickyTotalBar
        itemCount={cart.size}
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
