import { ChevronDown } from "lucide-react";

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
}

export default function SelectField({ label, value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1.5">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#C4788A] transition-colors"
        >
          {placeholder && (
            <option value="" disabled={value !== ""}>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>
    </label>
  );
}
