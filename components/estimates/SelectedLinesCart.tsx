import { X } from "lucide-react";
import { CartLine, formatYen, groupByCategory } from "./types";

interface SelectedLinesCartProps {
  lines: CartLine[];
  onRemove: (key: string) => void;
  onQuantityChange: (key: string, quantity: number) => void;
}

export default function SelectedLinesCart({ lines, onRemove, onQuantityChange }: SelectedLinesCartProps) {
  if (lines.length === 0) {
    return (
      <div className="card-luxury p-8 text-center text-sm text-gray-400">
        まだ明細がありません。下の価格表から項目を選んで追加してください。
      </div>
    );
  }

  const groups = groupByCategory(lines);

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.category} className="card-luxury overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-charcoal-700">{group.category}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {group.items.map((line) => (
              <div key={line.key} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-charcoal-900">{line.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatYen(line.unitPrice)} / {line.unit}
                  </p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => onQuantityChange(line.key, Math.max(1, Math.round(Number(e.target.value)) || 1))}
                  className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-sm text-right outline-none focus:border-[#C4788A] shrink-0"
                />
                <p className="text-sm font-semibold text-charcoal-900 w-24 text-right shrink-0">
                  {formatYen(line.unitPrice * line.quantity)}
                </p>
                <button
                  onClick={() => onRemove(line.key)}
                  className="flex items-center justify-center w-7 h-7 rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 shrink-0"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
