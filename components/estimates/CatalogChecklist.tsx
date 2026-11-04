import { useMemo, useState } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import { CatalogItem, PriceTier, PRICE_TIER_LABEL, availableTiers, formatYen, groupByCategory } from "./types";

interface CatalogChecklistProps {
  catalogItems: CatalogItem[];
  onAdd: (item: CatalogItem, tier: PriceTier, quantity: number) => void;
}

function ItemPicker({ item, onAdd }: { item: CatalogItem; onAdd: (item: CatalogItem, tier: PriceTier, quantity: number) => void }) {
  const tiers = useMemo(() => availableTiers(item), [item]);
  const [tier, setTier] = useState<PriceTier>(tiers[0].tier);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className={`px-4 py-3 ${!item.isActive ? "opacity-50" : ""}`}>
      <p className="text-sm font-medium text-charcoal-900 flex items-center gap-1.5">
        {item.name}
        {!item.isActive && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">非公開</span>}
      </p>
      {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}

      <div className="flex flex-wrap items-center gap-1.5 mt-2">
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
          onClick={() => onAdd(item, tier, quantity)}
          className="ml-auto flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full text-white"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          <Plus size={13} strokeWidth={2.5} />
          追加
        </button>
      </div>
    </div>
  );
}

export default function CatalogChecklist({ catalogItems, onAdd }: CatalogChecklistProps) {
  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openSubcategory, setOpenSubcategory] = useState<string | null>(null);

  const categoryGroups = useMemo(() => groupByCategory(catalogItems), [catalogItems]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.trim().toLowerCase();
    return catalogItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.subcategory.toLowerCase().includes(q)
    );
  }, [catalogItems, search]);

  if (catalogItems.length === 0) {
    return (
      <div className="card-luxury p-8 text-center text-sm text-gray-400">
        価格表に項目がありません。先に「価格表・プリセット管理」から項目を登録してください。
      </div>
    );
  }

  return (
    <div className="card-luxury overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="項目名で検索、または下のカテゴリから選ぶ"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
          />
        </div>
      </div>

      {searchResults ? (
        <div className="divide-y divide-gray-50">
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">該当する項目がありません</p>
          ) : (
            searchResults.map((item) => <ItemPicker key={item.id} item={item} onAdd={onAdd} />)
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {categoryGroups.map((catGroup) => {
            const isCatOpen = openCategory === catGroup.category;
            const subGroups = groupByCategory(
              catGroup.items.map((i) => ({ ...i, category: i.subcategory || "その他" }))
            );
            return (
              <div key={catGroup.category}>
                <button
                  onClick={() => {
                    setOpenCategory(isCatOpen ? null : catGroup.category);
                    setOpenSubcategory(null);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3.5 hover:bg-gray-50"
                >
                  <span className="text-sm font-semibold text-charcoal-900">{catGroup.category}</span>
                  <span className="flex items-center gap-2 text-xs text-gray-400">
                    {catGroup.items.length}項目
                    <ChevronRight size={14} strokeWidth={2} className={`transition-transform ${isCatOpen ? "rotate-90" : ""}`} />
                  </span>
                </button>

                {isCatOpen && (
                  <div className="bg-gray-50/60 divide-y divide-gray-100">
                    {subGroups.map((subGroup) => {
                      const isSubOpen = openSubcategory === subGroup.category;
                      return (
                        <div key={subGroup.category}>
                          <button
                            onClick={() => setOpenSubcategory(isSubOpen ? null : subGroup.category)}
                            className="w-full flex items-center justify-between gap-2 pl-7 pr-4 py-3 hover:bg-gray-100/60"
                          >
                            <span className="text-xs font-medium text-charcoal-700">{subGroup.category}</span>
                            <span className="flex items-center gap-2 text-[11px] text-gray-400">
                              {subGroup.items.length}項目
                              <ChevronRight size={12} strokeWidth={2} className={`transition-transform ${isSubOpen ? "rotate-90" : ""}`} />
                            </span>
                          </button>
                          {isSubOpen && (
                            <div className="bg-white divide-y divide-gray-50">
                              {subGroup.items.map((item) => (
                                <ItemPicker key={item.id} item={item} onAdd={onAdd} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
