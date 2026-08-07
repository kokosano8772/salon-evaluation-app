import { ReactNode } from "react";

interface GoogleReportStatCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  unit: string;
  description?: string;
  accent: string;
  valueColor?: string;
  children?: ReactNode;
}

// 実物PDFでは4指標が1枚のカードの中に並び、薄い区切り線で仕切られているだけ
// （カードごとの独立した背景・角丸ではない）。呼び出し側でdivide-xのflex行に並べる想定。
export default function GoogleReportStatCard({
  icon,
  title,
  value,
  unit,
  description,
  accent,
  valueColor,
  children,
}: GoogleReportStatCardProps) {
  return (
    <div className="flex-1 min-w-0 px-5 first:pl-0 last:pr-0 flex flex-col items-center text-center">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5"
        style={{ backgroundColor: `${accent}26`, color: accent }}
      >
        {icon}
      </div>
      <p className="text-sm font-bold text-charcoal-900 whitespace-pre-line leading-snug">{title}</p>
      <div className="mt-1.5">
        <span className="text-3xl font-extrabold" style={{ color: valueColor ?? "#1a1a1a" }}>
          {value}
        </span>
        <span className="text-sm font-bold ml-1 text-charcoal-700">{unit}</span>
      </div>
      {description && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>}
      {children && <div className="mt-1.5">{children}</div>}
    </div>
  );
}
