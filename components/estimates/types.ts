export interface CatalogItem {
  id: string;
  category: string;
  name: string;
  description: string;
  unit: string;
  unitPrice: number;
  sortOrder: number;
  isActive: boolean;
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
  quantity: number;
  amount: number;
  sortOrder: number;
}

export interface StoreOption {
  id: string;
  name: string;
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
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export function formatYen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

// 明細をカテゴリ別にグルーピングする。渡される配列はsort_order順である前提で、
// 最初に出てきたカテゴリの順番をそのままグループの並び順にする
// （EstimatePrintDocument・見積もり詳細画面の両方で使う共通ロジック）。
export function groupLineItemsByCategory(items: LineItem[]): { category: string; items: LineItem[] }[] {
  const groups: { category: string; items: LineItem[] }[] = [];
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
