import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface PercentFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
}

const STEP = 0.1;

export default function PercentField({ label, value, onChange }: PercentFieldProps) {
  const [text, setText] = useState(value !== undefined && value !== null ? String(value) : "");
  const focused = useRef(false);

  useEffect(() => {
    if (focused.current) return;
    setText(value !== undefined && value !== null ? String(value) : "");
  }, [value]);

  const current = value ?? 0;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setText(raw);
    if (raw === "" || raw === "-") return;
    const num = Number(raw);
    if (!Number.isNaN(num)) onChange(num);
  }

  function handleBlur() {
    focused.current = false;
    if (text === "" || text === "-") {
      setText("0");
      onChange(0);
    }
  }

  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1.5">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={text}
          step={STEP}
          onFocus={() => { focused.current = true; }}
          onChange={handleChange}
          onBlur={handleBlur}
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
