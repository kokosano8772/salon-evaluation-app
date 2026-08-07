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
    <div className="bg-white rounded-2xl p-6 h-full flex flex-col items-center text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: `${accent}68`, color: "#fff" }}
      >
        {icon}
      </div>
      <p className="text-base font-bold text-charcoal-900 whitespace-pre-line leading-snug">{title}</p>
      <div className="mt-2">
        <span className="text-3xl font-extrabold" style={{ color: valueColor ?? "#1a1a1a" }}>
          {value}
        </span>
        <span className="text-sm font-bold ml-1 text-charcoal-700">{unit}</span>
      </div>
      {description && <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">{description}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
