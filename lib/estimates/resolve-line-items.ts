import { createAdminClient } from "@/lib/supabase/admin";

export type PriceTier = "standard" | "line_registered" | "hp_managed";

const TIER_DISCOUNT_LABEL: Record<PriceTier, string> = {
  standard: "",
  line_registered: "公式ライン登録特別値引き",
  hp_managed: "HP管理企業様特別値引き",
};

export interface LineItemInput {
  catalogItemId?: string | null;
  // catalogItemId付きの行で、3段階料金のうちどれを使うか（省略時はstandard）。
  // 指定した区分の単価が価格表側で未設定（null）の場合はstandardにフォールバックする。
  priceTier?: PriceTier;
  // 既存の見積もり明細をそのまま維持する場合に使う。trueのとき、catalogItemIdの
  // 有無に関わらず価格表の再取得を行わず、以下の値をそのままスナップショットとして使う
  // （編集時に「触っていない行の単価が、価格表側の変更で再保存のたびに動いてしまう」
  // ことを防ぐため。catalogItemIdは追跡用にそのまま残してよい）。
  keepSnapshot?: boolean;
  // catalogItemIdが無い場合（価格表に無い自由入力行）、またはkeepSnapshot時に使う値
  name?: string;
  unitPrice?: number;
  unit?: string;
  description?: string;
  category?: string;
  // 数量は表記（見積書に「100枚」「4回」等と載せるための情報）のみで、金額計算には
  // 一切使わない。単価・割引・仕入れ料金はいずれも明細1行につき定額で、数量を
  // 掛けたり按分したりしない。
  quantity: number;
  // 仕入れ料金（印刷費など）。価格表の単価はデザイン・作業料金のみで、実際の仕入れは
  // 案件ごとに業者見積もりを取って手入力する性質のものなので、価格表には持たせず
  // 明細ごとに自由入力させる。
  procurementCost?: number;
  // 割引額・割引ラベル（keepSnapshot時のみクライアント値を使う。catalogItemId＋
  // priceTier解決時はサーバー側で価格表から計算し直す）。unit_priceは常に
  // 「基本作業料＝割引前の単価」のまま。amount = unit_price - discountAmount
  // + procurementCost（数量は計算に使わない）。
  discountAmount?: number;
  discountLabel?: string;
}

export interface ResolvedLineItem {
  catalog_item_id: string | null;
  category: string;
  name: string;
  description: string;
  unit: string;
  unit_price: number;
  procurement_cost: number;
  discount_amount: number;
  discount_label: string;
  quantity: number;
  amount: number;
  sort_order: number;
}

// unitPriceは常に基本作業料（割引前）を返す。割引額は定額で1回だけ差し引くものとして
// 別に返す（呼び出し側でunitPrice - discountAmountとする。数量は計算に使わない）。
function pickTier(
  catalogItem: { unit_price: number; unit_price_line_registered: number | null; unit_price_hp_managed: number | null },
  tier: PriceTier | undefined
): { unitPrice: number; discountAmount: number; discountLabel: string } {
  if (tier === "line_registered" && catalogItem.unit_price_line_registered !== null) {
    return {
      unitPrice: catalogItem.unit_price,
      discountAmount: catalogItem.unit_price - catalogItem.unit_price_line_registered,
      discountLabel: TIER_DISCOUNT_LABEL.line_registered,
    };
  }
  if (tier === "hp_managed" && catalogItem.unit_price_hp_managed !== null) {
    return {
      unitPrice: catalogItem.unit_price,
      discountAmount: catalogItem.unit_price - catalogItem.unit_price_hp_managed,
      discountLabel: TIER_DISCOUNT_LABEL.hp_managed,
    };
  }
  return { unitPrice: catalogItem.unit_price, discountAmount: 0, discountLabel: "" };
}

function resolveProcurementCost(input: LineItemInput): number {
  return Number.isFinite(input.procurementCost) && input.procurementCost! > 0 ? Math.round(input.procurementCost!) : 0;
}

// 見積もり明細の「スナップショット化」を行う。catalogItemId付きかつkeepSnapshotでない行は、
// クライアントが送ってきた名称・単価を一切信用せず、ここでestimate_catalog_itemsを
// 再取得してサーバー側の値（priceTierで指定した区分の単価・割引額）をそのまま使う
// （価格の改ざん・古い表示との不整合を防ぐため）。catalogItemIdが無い行（自由入力行）、
// またはkeepSnapshot指定の行（編集時に触っていない既存明細をそのまま維持する場合）は
// クライアント値をそのまま使う。仕入れ料金（procurementCost）は価格表に存在しない
// 手入力値のため、どのケースでもクライアント値をそのまま信用する。
export async function resolveLineItems(
  admin: ReturnType<typeof createAdminClient>,
  inputs: LineItemInput[]
): Promise<{ ok: true; lineItems: ResolvedLineItem[]; subtotal: number } | { ok: false; error: string }> {
  const catalogItemIds = Array.from(
    new Set(inputs.filter((i) => i.catalogItemId && !i.keepSnapshot).map((i) => i.catalogItemId!))
  );

  const catalogItemById = new Map<
    string,
    { id: string; category: string; name: string; description: string; unit: string; unit_price: number; unit_price_line_registered: number | null; unit_price_hp_managed: number | null }
  >();
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
    const procurementCost = resolveProcurementCost(input);
    let resolved: ResolvedLineItem;

    if (input.keepSnapshot) {
      if (!input.name?.trim()) {
        return { ok: false, error: "明細には項目名が必要です" };
      }
      const unitPrice = Number.isFinite(input.unitPrice) ? Math.round(input.unitPrice!) : 0;
      const discountAmount = Number.isFinite(input.discountAmount) && input.discountAmount! > 0 ? Math.round(input.discountAmount!) : 0;
      resolved = {
        catalog_item_id: input.catalogItemId ?? null,
        category: input.category?.trim() ?? "",
        name: input.name.trim(),
        description: input.description ?? "",
        unit: input.unit?.trim() || "式",
        unit_price: unitPrice,
        procurement_cost: procurementCost,
        discount_amount: discountAmount,
        discount_label: input.discountLabel?.trim() ?? "",
        quantity,
        amount: unitPrice - discountAmount + procurementCost,
        sort_order: i,
      };
    } else if (input.catalogItemId) {
      const catalogItem = catalogItemById.get(input.catalogItemId);
      if (!catalogItem) {
        return { ok: false, error: "存在しない価格表項目が指定されました" };
      }
      const { unitPrice, discountAmount, discountLabel } = pickTier(catalogItem, input.priceTier);
      resolved = {
        catalog_item_id: catalogItem.id,
        category: catalogItem.category,
        name: catalogItem.name,
        description: catalogItem.description,
        // 数量の単位（枚/部等）は価格表の既定値だが、同じ項目でも案件によって
        // 数え方が変わることがあるため、クライアントから指定があればそちらを使う
        // （表記のみの情報で金額計算には影響しないため、価格のように再取得して
        // 検証する必要は無い）。
        unit: input.unit?.trim() || catalogItem.unit,
        unit_price: unitPrice,
        procurement_cost: procurementCost,
        discount_amount: discountAmount,
        discount_label: discountLabel,
        quantity,
        amount: unitPrice - discountAmount + procurementCost,
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
        procurement_cost: procurementCost,
        discount_amount: 0,
        discount_label: "",
        quantity,
        amount: unitPrice + procurementCost,
        sort_order: i,
      };
    }

    lineItems.push(resolved);
    subtotal += resolved.amount;
  }

  return { ok: true, lineItems, subtotal };
}
