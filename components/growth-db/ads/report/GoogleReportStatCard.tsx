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
    <div className="bg-white rounded-2xl p-5 h-full flex flex-col items-center text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
        style={{ backgroundColor: `${accent}68`, color: "#fff" }}
      >
        {icon}
      </div>
      <p className="text-lg font-bold text-charcoal-900 whitespace-pre-line leading-snug">{title}</p>
      <div className="mt-1.5 whitespace-nowrap">
        <span className="text-4xl font-extrabold" style={{ color: valueColor ?? "#1a1a1a" }}>
          {value}
        </span>
        <span className="text-sm font-bold ml-0.5 text-charcoal-700">{unit}</span>
      </div>
      {description && <p className="text-sm text-gray-400 mt-1 leading-relaxed">{description}</p>}
      {children && <div className="mt-1.5">{children}</div>}
    </div>
  );
}
