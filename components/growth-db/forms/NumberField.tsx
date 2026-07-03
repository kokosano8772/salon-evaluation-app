interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  step?: number;
}

export default function NumberField({ label, value, onChange, suffix, min = 0, step = 1 }: NumberFieldProps) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1.5">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value ?? ""}
          min={min}
          step={step}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A] transition-colors tabular-nums"
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
