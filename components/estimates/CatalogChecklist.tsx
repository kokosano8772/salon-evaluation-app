import { useMemo, useState } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import { CatalogItem, ORDER_TYPE_LABEL, OrderType, PriceTier, PRICE_TIER_LABEL, availableTiers, formatYen, groupByCategory } from "./types";

interface CatalogChecklistProps {
  catalogItems: CatalogItem[];
  onAdd: (item: CatalogItem, tier: PriceTier, quantity: number) => void;
}

const NO_ORDER_TYPE = "none" as const;
type OrderTypeFilterValue = OrderType | typeof NO_ORDER_TYPE;

function ItemPicker({ item, onAdd }: { item: CatalogItem; onAdd: (item: CatalogItem, tier: PriceTier, quantity: number) => void }) {
  const tiers = useMemo(() => availableTiers(item), [item]);
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<PriceTier>(tiers[0].tier);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className={!item.isActive ? "opacity-50" : ""}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors ${open ? "bg-[#C4788A0D]" : "hover:bg-gray-50"}`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-charcoal-900 flex items-center gap-1.5 flex-wrap">
            {item.name}
            {item.orderType && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#C4788A14] text-[#A85E74]">
                {ORDER_TYPE_LABEL[item.orderType]}
              </span>
            )}
            {!item.isActive && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">非公開</span>}
          </p>
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {formatYen(item.unitPrice)} / {item.unit}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-3">
          {item.description && <p className="text-xs text-gray-400 mb-2">{item.description}</p>}
          <div className="flex flex-wrap items-center gap-1.5">
            {tiers.map((t) => (
              <button
                key={t.tier}
                onClick={() => setTier(t.tier)}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                  tier === t.tier ? "bg-[#C4788A14] text-[#A85E74] border-[#C4788A55]" : "text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {PRICE_TIER_LABEL[t.tier]} {formatYen(t.unitPrice)}
                {t.discount > 0 && <span className="opacity-70"> (-{formatYen(t.discount)})</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-2.5">
            <span className="text-xs text-gray-400">数量</span>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.round(Number(e.target.value)) || 1))}
              className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-sm text-right outline-none focus:border-[#C4788A]"
            />
            <span className="text-xs text-gray-400">{item.unit}</span>
            <button
              onClick={() => {
                onAdd(item, tier, quantity);
                setOpen(false);
                setQuantity(1);
              }}
              className="ml-auto flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
            >
              <Plus size={13} strokeWidth={2.5} />
              追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CatalogChecklist({ catalogItems, onAdd }: CatalogChecklistProps) {
  const [search, setSearch] = useState("");
  // 1つの見積もり明細を追加するのに複数の分類・区分を組み合わせて絞り込むことは無いため、
  // タグは複数選択ではなく1つだけ選べる（別のタグを選ぶと前のタグは自動で外れる）。
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilterValue | null>(null);
  // 中分類ごとに折りたたんでおき、クリックした分だけ開く（商品一覧が縦に長くなりすぎる
  // のを防ぐ）。検索・タグ（今回は？／分類）のどれかで絞り込んでいる間は、せっかく
  // 絞り込んだ結果をさらにクリックして開かせるのは二度手間になるため、折りたたみ状態に
  // 関わらず常に展開する。
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const isSearching = search.trim().length > 0;

  const toggleSubcategory = (key: string) => {
    setExpandedSubcategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const categories = useMemo(() => Array.from(new Set(catalogItems.map((i) => i.category))), [catalogItems]);

  const toggleCategory = (category: string) => {
    setCategoryFilter((prev) => (prev === category ? null : category));
  };

  const toggleOrderType = (value: OrderTypeFilterValue) => {
    setOrderTypeFilter((prev) => (prev === value ? null : value));
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalogItems.filter((item) => {
      if (categoryFilter !== null && item.category !== categoryFilter) return false;
      if (orderTypeFilter !== null) {
        const value: OrderTypeFilterValue = item.orderType ?? NO_ORDER_TYPE;
        if (value !== orderTypeFilter) return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.subcategory.toLowerCase().includes(q)
      );
    });
  }, [catalogItems, search, categoryFilter, orderTypeFilter]);

  const groups = useMemo(() => groupByCategory(filteredItems), [filteredItems]);
  const isFiltering = isSearching || categoryFilter !== null || orderTypeFilter !== null;

  if (catalogItems.length === 0) {
    return (
      <div className="card-luxury p-8 text-center text-sm text-gray-400">
        価格表に項目がありません。先に「価格表・プリセット管理」から項目を登録してください。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card-luxury p-4 space-y-3">
        <div className="relative">
          <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="項目名・カテゴリで検索（例: 名刺 両面 シンプル）"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
          />
        </div>

        <div>
          <p className="text-[11px] text-gray-400 mb-1.5">今回は？</p>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["first_time", ORDER_TYPE_LABEL.first_time],
                ["revision", ORDER_TYPE_LABEL.revision],
                ["resubmission", ORDER_TYPE_LABEL.resubmission],
                [NO_ORDER_TYPE, "区分なし（オプション等）"],
              ] as [OrderTypeFilterValue, string][]
            ).map(([value, label]) => {
              const active = orderTypeFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => toggleOrderType(value)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                  style={
                    active
                      ? { backgroundColor: "#C4788A14", color: "#A85E74", borderColor: "#C4788A55" }
                      : { backgroundColor: "white", color: "#6b7280", borderColor: "#e5e7eb" }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[11px] text-gray-400 mb-1.5">分類</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => {
              const active = categoryFilter === category;
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                  style={
                    active
                      ? { backgroundColor: "#C4788A14", color: "#A85E74", borderColor: "#C4788A55" }
                      : { backgroundColor: "white", color: "#6b7280", borderColor: "#e5e7eb" }
                  }
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card-luxury overflow-hidden">
        {filteredItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">該当する項目がありません</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {groups.map((group) => {
              const subGroups = groupByCategory(group.items.map((i) => ({ ...i, category: i.subcategory || "その他" })));
              return (
                <div key={group.category}>
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-xs font-semibold text-charcoal-700">{group.category}</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {subGroups.map((subGroup) => {
                      const key = `${group.category}:::${subGroup.category}`;
                      const isOpen = isFiltering || expandedSubcategories.has(key);
                      return (
                        <div key={key}>
                          <button
                            onClick={() => toggleSubcategory(key)}
                            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-gray-50"
                          >
                            <span className="text-xs font-medium text-charcoal-700">{subGroup.category}</span>
                            <span className="flex items-center gap-2 text-[11px] text-gray-400">
                              {subGroup.items.length}項目
                              <ChevronRight size={12} strokeWidth={2} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
                            </span>
                          </button>
                          {isOpen && (
                            <div className="divide-y divide-gray-50 bg-gray-50/40">
                              {subGroup.items.map((item) => (
                                <ItemPicker key={item.id} item={item} onAdd={onAdd} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
