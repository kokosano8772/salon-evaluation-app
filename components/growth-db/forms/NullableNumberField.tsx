import NumberField from "./NumberField";

interface NullableNumberFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  suffix?: string;
  min?: number;
  step?: number;
}

// 「わからない・未計測」を明示的に表せる数値入力。チェックを入れると値をnull（不明）にする。
export default function NullableNumberField({ label, value, onChange, suffix, min, step }: NullableNumberFieldProps) {
  const isUnknown = value === null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="block text-xs text-gray-500">{label}</span>
        <label className="flex items-center gap-1.5 text-xs text-gray-400">
          <input type="checkbox" checked={isUnknown} onChange={(e) => onChange(e.target.checked ? null : 0)} />
          不明
        </label>
      </div>
      {isUnknown ? (
        <div className="w-full px-3.5 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400">未設定</div>
      ) : (
        <NumberField label="" value={value} onChange={onChange} suffix={suffix} min={min} step={step} />
      )}
    </div>
  );
}
