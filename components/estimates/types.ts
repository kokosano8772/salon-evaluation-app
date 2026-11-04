export type PriceTier = "standard" | "line_registered" | "hp_managed";

export const PRICE_TIER_LABEL: Record<PriceTier, string> = {
  standard: "基本作業料",
  line_registered: "公式ライン登録",
  hp_managed: "HP管理企業様",
};

// 見積もり上で割引行として表示する際のラベル（lib/estimates/resolve-line-items.tsの
// TIER_DISCOUNT_LABELと同じ文言。サーバー側はservice_roleを扱う別モジュールのため
// クライアントからは直接importできず、ここに複製している）。
export const PRICE_TIER_DISCOUNT_LABEL: Record<PriceTier, string> = {
  standard: "",
  line_registered: "公式ライン登録特別値引き",
  hp_managed: "HP管理企業様特別値引き",
};

export type OrderType = "first_time" | "revision" | "resubmission";

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  first_time: "初回",
  revision: "一部修正",
  resubmission: "再入稿・リピート",
};

export interface CatalogItem {
  id: string;
  category: string;
  subcategory: string;
  name: string;
  description: string;
  unit: string;
  unitPrice: number;
  unitPriceLineRegistered: number | null;
  unitPriceHpManaged: number | null;
  // 初回／一部修正／再入稿・リピートの区分。区分の無い項目（WEB制作のオプション・
  // 月額プラン等）はnull。
  orderType: OrderType | null;
  sortOrder: number;
  isActive: boolean;
}

// その項目で選べる料金区分と単価の一覧（nullの区分は選択肢から除く）。
// discountは基本作業料（unitPrice）からの割引額。基本作業料自身は0。
export function availableTiers(item: CatalogItem): { tier: PriceTier; unitPrice: number; discount: number }[] {
  const tiers: { tier: PriceTier; unitPrice: number; discount: number }[] = [
    { tier: "standard", unitPrice: item.unitPrice, discount: 0 },
  ];
  if (item.unitPriceLineRegistered !== null) {
    tiers.push({ tier: "line_registered", unitPrice: item.unitPriceLineRegistered, discount: item.unitPrice - item.unitPriceLineRegistered });
  }
  if (item.unitPriceHpManaged !== null) {
    tiers.push({ tier: "hp_managed", unitPrice: item.unitPriceHpManaged, discount: item.unitPrice - item.unitPriceHpManaged });
  }
  return tiers;
}

// 見積もりビルダーで「選択済み（カート）」として積み上げる1行。価格表＋料金区分から
// 追加した時点の表示用の値をそのまま持つ（編集時に既存の明細をそのまま維持する場合は
// catalogItemIdはあってもpriceTierがnullになりうる＝価格表から新たに選び直したものではない、
// という意味。送信時はkeepSnapshot:trueとして扱い、価格表の再取得を行わない）。
export interface CartLine {
  key: string;
  catalogItemId: string | null;
  priceTier: PriceTier | null;
  category: string;
  name: string;
  description: string;
  unit: string;
  unitPrice: number;
  // 仕入れ料金（印刷費など）。デザイン・作業料金とは別に、数量に比例せず定額で
  // 加算される実費。価格表には無いため、明細ごとに手入力する。
  procurementCost: number;
  // 表示用。unitPriceは既に割引後の単価なので、割引前の単価は
  // unitPrice+discount。amountの計算には使わない（unitPriceが既に割引後のため）。
  discount: number;
  discountLabel: string;
  quantity: number;
}

export interface TemplateItem {
  catalogItemId: string;
  defaultQuantity: number;
  sortOrder: number;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  catalogItemIsActive: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  items: TemplateItem[];
}

export interface LineItem {
  id?: string;
  catalogItemId: string | null;
  category: string;
  name: string;
  description: string;
  unit: string;
  unitPrice: number;
  procurementCost: number;
  discountAmount: number;
  discountLabel: string;
  quantity: number;
  amount: number;
  sortOrder: number;
}

export interface StoreOption {
  id: string;
  name: string;
}

// POST/PATCH /api/estimates(/[id])に送る明細1件分。サーバー側のLineItemInput
// （lib/estimates/resolve-line-items.ts）と同じ形だが、そちらはservice_role
// クライアントを扱うサーバー専用モジュールを import しているため、クライアント
// コンポーネントからはこちらの独立した型を使う（誤ってservice_roleキーを含む
// モジュールをクライアントバンドルに引き込まないため）。
export interface LineItemPayload {
  catalogItemId: string | null;
  priceTier?: PriceTier;
  keepSnapshot?: boolean;
  category?: string;
  name?: string;
  description?: string;
  unit?: string;
  unitPrice?: number;
  quantity: number;
  procurementCost?: number;
  discountAmount?: number;
  discountLabel?: string;
}

export interface EstimateHeader {
  id: string;
  storeId: string | null;
  clientName: string;
  clientContact: string;
  title: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  sourceTemplateId: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  productionDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export function formatYen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

// category（文字列）を持つ配列をカテゴリ別にグルーピングする。渡される配列はsort_order順
// である前提で、最初に出てきたカテゴリの順番をそのままグループの並び順にする
// （EstimatePrintDocument・見積もり詳細画面・カート表示など複数箇所で使う共通ロジック）。
export function groupByCategory<T extends { category: string }>(items: T[]): { category: string; items: T[] }[] {
  const groups: { category: string; items: T[] }[] = [];
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
