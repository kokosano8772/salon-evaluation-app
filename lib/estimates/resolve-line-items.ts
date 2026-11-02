import { createAdminClient } from "@/lib/supabase/admin";

export interface LineItemInput {
  catalogItemId?: string | null;
  // catalogItemIdが無い場合（価格表に無い自由入力行）のみ使う値
  name?: string;
  unitPrice?: number;
  unit?: string;
  description?: string;
  category?: string;
  quantity: number;
}

export interface ResolvedLineItem {
  catalog_item_id: string | null;
  category: string;
  name: string;
  description: string;
  unit: string;
  unit_price: number;
  quantity: number;
  amount: number;
  sort_order: number;
}

// 見積もり明細の「スナップショット化」を行う。catalogItemId付きの行は、クライアントが
// 送ってきた名称・単価を一切信用せず、ここでestimate_catalog_itemsを再取得して
// サーバー側の値をそのまま使う（価格の改ざん・古い表示からの不整合を防ぐため）。
// catalogItemIdが無い行（価格表に無い自由入力行）だけはクライアント値をそのまま使う。
export async function resolveLineItems(
  admin: ReturnType<typeof createAdminClient>,
  inputs: LineItemInput[]
): Promise<{ ok: true; lineItems: ResolvedLineItem[]; subtotal: number } | { ok: false; error: string }> {
  const catalogItemIds = Array.from(new Set(inputs.filter((i) => i.catalogItemId).map((i) => i.catalogItemId!)));

  const catalogItemById = new Map<string, { id: string; category: string; name: string; description: string; unit: string; unit_price: number }>();
  if (catalogItemIds.length > 0) {
    const { data, error } = await admin.from("estimate_catalog_items").select("*").in("id", catalogItemIds);
    if (error) return { ok: false, error: error.message };
    for (const c of data ?? []) catalogItemById.set(c.id, c);
  }

  const lineItems: ResolvedLineItem[] = [];
  let subtotal = 0;

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const quantity = Number.isFinite(input.quantity) && input.quantity > 0 ? Math.round(input.quantity) : 1;
    let resolved: ResolvedLineItem;

    if (input.catalogItemId) {
      const catalogItem = catalogItemById.get(input.catalogItemId);
      if (!catalogItem) {
        return { ok: false, error: "存在しない価格表項目が指定されました" };
      }
      resolved = {
        catalog_item_id: catalogItem.id,
        category: catalogItem.category,
        name: catalogItem.name,
        description: catalogItem.description,
        unit: catalogItem.unit,
        unit_price: catalogItem.unit_price,
        quantity,
        amount: catalogItem.unit_price * quantity,
        sort_order: i,
      };
    } else {
      if (!input.name?.trim()) {
        return { ok: false, error: "自由入力の明細には項目名が必要です" };
      }
      const unitPrice = Number.isFinite(input.unitPrice) ? Math.round(input.unitPrice!) : 0;
      resolved = {
        catalog_item_id: null,
        category: input.category?.trim() ?? "",
        name: input.name.trim(),
        description: input.description ?? "",
        unit: input.unit?.trim() || "式",
        unit_price: unitPrice,
        quantity,
        amount: unitPrice * quantity,
        sort_order: i,
      };
    }

    lineItems.push(resolved);
    subtotal += resolved.amount;
  }

  return { ok: true, lineItems, subtotal };
}
