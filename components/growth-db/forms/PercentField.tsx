import { ChevronDown, ChevronUp } from "lucide-react";

interface PercentFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
}

const STEP = 0.1;

export default function PercentField({ label, value, onChange }: PercentFieldProps) {
  const current = value ?? 0;

  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1.5">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value ?? ""}
          step={STEP}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="w-full px-3.5 py-2.5 pr-16 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A] transition-colors tabular-nums"
        />
        <span className="absolute right-9 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onChange(Math.round((current + STEP) * 10) / 10)}
            className="w-5 h-3.5 flex items-center justify-center text-gray-400 hover:text-[#C4788A] transition-colors"
          >
            <ChevronUp size={11} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onChange(Math.round((current - STEP) * 10) / 10)}
            className="w-5 h-3.5 flex items-center justify-center text-gray-400 hover:text-[#C4788A] transition-colors"
          >
            <ChevronDown size={11} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </label>
  );
}
