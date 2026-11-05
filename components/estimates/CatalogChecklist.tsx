import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { CatalogItem, ORDER_TYPE_LABEL, OrderType, PriceTier, PRICE_TIER_LABEL, availableTiers, formatYen, groupByCategory } from "./types";

export interface AddOptions {
  unit: string;
  // 価格表の項目名は「修正料金(8割以上修正)」のように社内向けの区分名でしかなく、
  // どの商品（チラシ・DM・名刺等）の明細か見積書だけでは分からないことがあるため、
  // 追加する時点で具体的な商品名・サイズ・紙を補足できるようにする（任意項目。
  // 入力があれば明細の補足説明に追加される）。
  productName: string;
  size: string;
  paper: string;
}

interface CatalogChecklistProps {
  catalogItems: CatalogItem[];
  onAdd: (item: CatalogItem, tier: PriceTier, quantity: number, options: AddOptions) => void;
}

const NO_ORDER_TYPE = "none" as const;
type OrderTypeFilterValue = OrderType | typeof NO_ORDER_TYPE;

// 数量の単位は価格表の既定値（item.unit）をそのまま使うことが多いが、同じ項目でも
// 案件によって「枚」「部」等、数え方が変わることがあるため選べるようにする。
// 候補は実際のカタログで使われている単位＋よく使われる印刷物の単位。
const UNIT_OPTIONS = ["枚", "部", "式", "回", "個", "セット", "ページ", "箇所", "月", "年", "時間"];

// サイズは自由入力にすると表記ゆれが起きるため選択式にする。候補は実際の価格表の
// チラシ・フライヤーの料金区分で使われているサイズの組み合わせ。
const SIZE_OPTIONS = ["A3/B4", "A4/B5", "A5/B6", "A3", "B4", "A4", "B5", "A5", "B6"];

function ItemPicker({ item, onAdd }: { item: CatalogItem; onAdd: (item: CatalogItem, tier: PriceTier, quantity: number, options: AddOptions) => void }) {
  const tiers = useMemo(() => availableTiers(item), [item]);
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<PriceTier>(tiers[0].tier);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState(item.unit);
  const [productName, setProductName] = useState("");
  const [size, setSize] = useState("");
  const [paper, setPaper] = useState("");

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
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="px-2 py-1 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A] bg-white"
            >
              {(UNIT_OPTIONS.includes(item.unit) ? UNIT_OPTIONS : [item.unit, ...UNIT_OPTIONS]).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* 商品名・サイズ・紙はどれも任意。入力があれば明細の補足説明に追加される
              （見積書上で「何の商品の明細か」をその場で具体的に書けるようにするため）。 */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="商品名（任意）例: 〇〇チラシ"
              className="flex-1 min-w-[140px] px-2 py-1 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
            />
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="px-2 py-1 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A] bg-white"
            >
              <option value="">サイズ（任意）</option>
              {SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={paper}
              onChange={(e) => setPaper(e.target.value)}
              placeholder="紙（任意）"
              className="w-24 px-2 py-1 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#C4788A]"
            />
          </div>

          <div className="flex justify-end mt-2">
            <button
              onClick={() => {
                onAdd(item, tier, quantity, { unit, productName, size, paper });
                setOpen(false);
                setQuantity(1);
                setUnit(item.unit);
                setProductName("");
                setSize("");
                setPaper("");
              }}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full text-white"
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
  // 1つの見積もり明細を追加するのに複数の分類・区分を組み合わせて絞り込むことは無いため、
  // タグは複数選択ではなく1つだけ選べる（別のタグを選ぶと前のタグは自動で外れる）。
  // 大分類→中分類はタグを選ぶだけで絞り込める（アコーディオンのクリック展開は廃止）。
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(null);
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilterValue | null>(null);

  const categories = useMemo(() => Array.from(new Set(catalogItems.map((i) => i.category))), [catalogItems]);
  const subcategories = useMemo(() => {
    if (!categoryFilter) return [];
    return Array.from(new Set(catalogItems.filter((i) => i.category === categoryFilter).map((i) => i.subcategory || "その他")));
  }, [catalogItems, categoryFilter]);

  // 大分類を変えたら、もう存在しない中分類タグが選ばれたままにならないようにリセットする。
  useEffect(() => {
    setSubcategoryFilter(null);
  }, [categoryFilter]);

  const toggleCategory = (category: string) => {
    setCategoryFilter((prev) => (prev === category ? null : category));
  };

  const toggleSubcategory = (subcategory: string) => {
    setSubcategoryFilter((prev) => (prev === subcategory ? null : subcategory));
  };

  const toggleOrderType = (value: string) => {
    setOrderTypeFilter((prev) => (prev === value ? null : (value as OrderTypeFilterValue)));
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalogItems.filter((item) => {
      if (categoryFilter !== null && item.category !== categoryFilter) return false;
      if (subcategoryFilter !== null && (item.subcategory || "その他") !== subcategoryFilter) return false;
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
  }, [catalogItems, search, categoryFilter, subcategoryFilter, orderTypeFilter]);

  const groups = useMemo(() => groupByCategory(filteredItems), [filteredItems]);
  const hasAnyFilter = search.trim().length > 0 || categoryFilter !== null || orderTypeFilter !== null;

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

        <FilterChipRow
          label="分類"
          active={categoryFilter}
          onToggle={toggleCategory}
          options={categories.map((c) => ({ value: c, label: c }))}
        />

        {categoryFilter && subcategories.length > 0 && (
          <FilterChipRow
            label="詳細"
            active={subcategoryFilter}
            onToggle={toggleSubcategory}
            options={subcategories.map((s) => ({ value: s, label: s }))}
          />
        )}
      </div>

      <div className="card-luxury overflow-hidden">
        {!hasAnyFilter ? (
          <p className="text-sm text-gray-400 text-center py-8">検索するか、上のタグで絞り込んでください</p>
        ) : filteredItems.length === 0 ? (
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
                  {subGroups.map((subGroup) => (
                    <div key={subGroup.category}>
                      {subGroups.length > 1 && (
                        <div className="px-4 py-1.5 bg-gray-50/60">
                          <p className="text-[11px] font-medium text-gray-400">{subGroup.category}</p>
                        </div>
                      )}
                      <div className="divide-y divide-gray-50">
                        {subGroup.items.map((item) => (
                          <ItemPicker key={item.id} item={item} onAdd={onAdd} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
