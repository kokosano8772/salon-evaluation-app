import { useEffect, useMemo, useState } from "react";
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

function FilterChipRow({
  label,
  options,
  active,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  active: string | null;
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isActive = active === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
              style={
                isActive
                  ? { backgroundColor: "#C4788A14", color: "#A85E74", borderColor: "#C4788A55" }
                  : { backgroundColor: "white", color: "#6b7280", borderColor: "#e5e7eb" }
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CatalogChecklist({ catalogItems, onAdd }: CatalogChecklistProps) {
  const [search, setSearch] = useState("");
  // 1つの見積もり明細を追加するのに複数の区分を組み合わせて絞り込むことは無いため、
  // タグは複数選択ではなく1つだけ選べる（別のタグを選ぶと前のタグは自動で外れる）。
  // 大分類（WEB制作／その他／印刷物制作／月額運用プラン）はアコーディオンで折りたたみ、
  // 開いた大分類の中で詳細（中分類）タグで絞り込む。検索中はこの折りたたみを無視し、
  // 全カテゴリ横断でヒットした項目をそのまま見せる。
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(null);
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilterValue | null>(null);
  const isSearching = search.trim().length > 0;

  const categories = useMemo(() => Array.from(new Set(catalogItems.map((i) => i.category))), [catalogItems]);
  const subcategories = useMemo(() => {
    if (!expandedCategory) return [];
    return Array.from(new Set(catalogItems.filter((i) => i.category === expandedCategory).map((i) => i.subcategory || "その他")));
  }, [catalogItems, expandedCategory]);

  // 開いている大分類を変えたら、もう存在しない中分類タグが選ばれたままにならないようにする。
  useEffect(() => {
    setSubcategoryFilter(null);
  }, [expandedCategory]);

  const toggleExpandedCategory = (category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  const toggleSubcategory = (subcategory: string) => {
    setSubcategoryFilter((prev) => (prev === subcategory ? null : subcategory));
  };

  const toggleOrderType = (value: string) => {
    setOrderTypeFilter((prev) => (prev === value ? null : (value as OrderTypeFilterValue)));
  };

  const matchesOrderType = (item: CatalogItem) => {
    if (orderTypeFilter === null) return true;
    const value: OrderTypeFilterValue = item.orderType ?? NO_ORDER_TYPE;
    return value === orderTypeFilter;
  };

  // 検索中：大分類の折りたたみを無視し、全項目から検索語＋今回は？タグに一致するものを
  // そのまま見せる。検索していない間：開いている大分類＋選んだ詳細タグに一致するものだけ。
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (isSearching) {
      return catalogItems.filter((item) => {
        if (!matchesOrderType(item)) return false;
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.subcategory.toLowerCase().includes(q)
        );
      });
    }
    if (!expandedCategory) return [];
    return catalogItems.filter((item) => {
      if (item.category !== expandedCategory) return false;
      if (subcategoryFilter !== null && (item.subcategory || "その他") !== subcategoryFilter) return false;
      return matchesOrderType(item);
    });
  }, [catalogItems, search, isSearching, expandedCategory, subcategoryFilter, orderTypeFilter]);

  const visibleGroups = useMemo(() => groupByCategory(visibleItems), [visibleItems]);

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

        <FilterChipRow
          label="今回は？"
          active={orderTypeFilter}
          onToggle={toggleOrderType}
          options={[
            { value: "first_time", label: ORDER_TYPE_LABEL.first_time },
            { value: "revision", label: ORDER_TYPE_LABEL.revision },
            { value: "resubmission", label: ORDER_TYPE_LABEL.resubmission },
            { value: NO_ORDER_TYPE, label: "区分なし（オプション等）" },
          ]}
        />
      </div>

      {isSearching ? (
        <div className="card-luxury overflow-hidden">
          {visibleItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">該当する項目がありません</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {visibleGroups.map((group) => (
                <div key={group.category}>
                  <div className="px-4 py-2 bg-gray-50">
                    <p className="text-xs font-semibold text-charcoal-700">{group.category}</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {group.items.map((item) => (
                      <ItemPicker key={item.id} item={item} onAdd={onAdd} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card-luxury overflow-hidden divide-y divide-gray-100">
          {categories.map((category) => {
            const isOpen = expandedCategory === category;
            const countInCategory = catalogItems.filter((i) => i.category === category && matchesOrderType(i)).length;
            return (
              <div key={category}>
                <button
                  onClick={() => toggleExpandedCategory(category)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100"
                >
                  <span className="text-sm font-semibold text-charcoal-700">{category}</span>
                  <span className="flex items-center gap-2 text-[11px] text-gray-400">
                    {countInCategory}項目
                    <ChevronRight size={14} strokeWidth={2} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </span>
                </button>

                {isOpen && (
                  <div className="p-4 space-y-3">
                    {subcategories.length > 0 && (
                      <FilterChipRow
                        label="詳細"
                        active={subcategoryFilter}
                        onToggle={toggleSubcategory}
                        options={subcategories.map((s) => ({ value: s, label: s }))}
                      />
                    )}

                    <div className="card-luxury overflow-hidden">
                      {visibleItems.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">
                          {subcategoryFilter ? "該当する項目がありません" : "上の「詳細」から絞り込んでください"}
                        </p>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {visibleItems.map((item) => (
                            <ItemPicker key={item.id} item={item} onAdd={onAdd} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
