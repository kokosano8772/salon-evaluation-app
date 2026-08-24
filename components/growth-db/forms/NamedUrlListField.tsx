import { Plus, Trash2 } from "lucide-react";
import { NamedUrl } from "@/lib/growth-db/types";

interface NamedUrlListFieldProps {
  label: string;
  description?: string;
  value: NamedUrl[];
  onChange: (value: NamedUrl[]) => void;
  namePlaceholder?: string;
  urlPlaceholder?: string;
}

// 複数支店のURL（店舗名+URLのペア）を追加・削除できる入力欄。
// 支店が1つしかないサロンは、店舗名を空のまま1行だけ使えばよい。
export default function NamedUrlListField({
  label,
  description,
  value,
  onChange,
  namePlaceholder = "例: 平針店",
  urlPlaceholder = "https://...",
}: NamedUrlListFieldProps) {
  const add = () => onChange([...value, { id: crypto.randomUUID(), name: "", url: "" }]);
  const remove = (id: string) => onChange(value.filter((row) => row.id !== id));
  const patch = (id: string, key: "name" | "url", v: string) =>
    onChange(value.map((row) => (row.id === id ? { ...row, [key]: v } : row)));

  return (
    <div className="sm:col-span-2">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div>
          <span className="block text-xs text-gray-500">{label}</span>
          {description && <span className="block text-xs text-gray-400 mt-0.5">{description}</span>}
        </div>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-charcoal-700 hover:bg-gray-50 shrink-0 whitespace-nowrap"
        >
          <Plus size={12} strokeWidth={2} />
          追加
        </button>
      </div>
      {value.length === 0 ? (
        <p className="text-xs text-gray-300 py-2">未設定</p>
      ) : (
        <div className="space-y-2">
          {value.map((row) => (
            <div key={row.id} className="flex gap-2 items-center">
              <input
                type="text"
                value={row.name}
                placeholder={namePlaceholder}
                onChange={(e) => patch(row.id, "name", e.target.value)}
                className="w-28 shrink-0 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A] transition-colors"
              />
              <input
                type="text"
                value={row.url}
                placeholder={urlPlaceholder}
                onChange={(e) => patch(row.id, "url", e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A] transition-colors"
              />
              <button
                type="button"
                onClick={() => remove(row.id)}
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                title="削除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
