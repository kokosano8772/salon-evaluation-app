import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface NumberFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  step?: number;
}

export default function NumberField({ label, value, onChange, suffix, min = 0, step = 1 }: NumberFieldProps) {
  const [text, setText] = useState(value !== undefined && value !== null ? String(value) : "");
  const focused = useRef(false);

  // 外部から値が変わった場合（別の月のデータに切り替えた等）は表示に反映する。
  // ただし入力中に上書きしてしまわないよう、フォーカス中は同期しない。
  useEffect(() => {
    if (focused.current) return;
    setText(value !== undefined && value !== null ? String(value) : "");
  }, [value]);

  const current = value ?? 0;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setText(raw);
    // 空・マイナス単体・小数点単体などの入力途中の状態はまだ0を確定させない
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
          min={min}
          step={step}
          onFocus={() => { focused.current = true; }}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-3.5 py-2.5 ${suffix ? "pr-16" : "pr-9"} rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A] transition-colors tabular-nums`}
        />
        {suffix && (
          <span className="absolute right-9 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            {suffix}
          </span>
        )}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onChange(current + step)}
            className="w-5 h-3.5 flex items-center justify-center text-gray-400 hover:text-[#C4788A] transition-colors"
          >
            <ChevronUp size={11} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={() => onChange(Math.max(min, current - step))}
            className="w-5 h-3.5 flex items-center justify-center text-gray-400 hover:text-[#C4788A] transition-colors"
          >
            <ChevronDown size={11} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </label>
  );
}
