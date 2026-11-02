import { formatYen } from "./types";

interface StickyTotalBarProps {
  itemCount: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  onSave: () => void;
  saving: boolean;
  saveLabel?: string;
}

export default function StickyTotalBar({
  itemCount,
  subtotal,
  taxRate,
  taxAmount,
  total,
  onSave,
  saving,
  saveLabel = "見積もりを保存",
}: StickyTotalBarProps) {
  return (
    <div className="sticky bottom-4 z-10">
      <div className="card-luxury p-4 flex flex-wrap items-center justify-between gap-4" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <div className="flex items-center gap-5 flex-wrap">
          <div>
            <p className="text-[11px] text-gray-400">選択中</p>
            <p className="text-sm font-semibold text-charcoal-900">{itemCount}項目</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">小計</p>
            <p className="text-sm font-semibold text-charcoal-900">{formatYen(subtotal)}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">消費税（{Math.round(taxRate * 100)}%）</p>
            <p className="text-sm font-semibold text-charcoal-900">{formatYen(taxAmount)}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400">合計</p>
            <p className="text-lg font-bold" style={{ color: "#C4788A" }}>
              {formatYen(total)}
            </p>
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={saving || itemCount === 0}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 shrink-0"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          {saving ? "保存中..." : saveLabel}
        </button>
      </div>
    </div>
  );
}
