import { CatalogItem, formatYen } from "./types";

interface CatalogChecklistProps {
  catalogItems: CatalogItem[];
  selected: Map<string, number>;
  onToggle: (item: CatalogItem) => void;
  onQuantityChange: (catalogItemId: string, quantity: number) => void;
}

// catalogItemsは呼び出し側（API）でcategory, sort_order順に並んでいる前提。
// その並び順のまま、最初に出てきたカテゴリの順でグルーピングする。
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

export default function CatalogChecklist({ catalogItems, selected, onToggle, onQuantityChange }: CatalogChecklistProps) {
  const groups = groupByCategory(catalogItems);

  if (catalogItems.length === 0) {
    return (
      <div className="card-luxury p-8 text-center text-sm text-gray-400">
        価格表に項目がありません。先に「価格表・プリセット管理」から項目を登録してください。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.category} className="card-luxury p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-4">{group.category}</p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const quantity = selected.get(item.id);
              const isChecked = quantity !== undefined;
              return (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                    isChecked ? "bg-[#C4788A0D]" : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggle(item)}
                    className="mt-1 w-4 h-4 accent-[#C4788A] shrink-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal-900 flex items-center gap-1.5">
                      {item.name}
                      {!item.isActive && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">非公開</span>
                      )}
                    </p>
                    {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatYen(item.unitPrice)} / {item.unit}
                    </p>
                  </div>
                  {isChecked && (
                    <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.preventDefault()}>
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => onQuantityChange(item.id, Math.max(1, Math.round(Number(e.target.value)) || 1))}
                        className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-sm text-right outline-none focus:border-[#C4788A]"
                      />
                      <span className="text-xs text-gray-400 w-20 text-right">{formatYen(item.unitPrice * quantity)}</span>
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
