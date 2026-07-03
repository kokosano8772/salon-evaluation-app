interface PercentFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
}

export default function PercentField({ label, value, onChange }: PercentFieldProps) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1.5">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value ?? ""}
          step={0.1}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="w-full px-3.5 py-2.5 pr-8 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A] transition-colors tabular-nums"
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
      </div>
    </label>
  );
}
