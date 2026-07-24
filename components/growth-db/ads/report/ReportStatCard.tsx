import { ReactNode } from "react";

interface ReportStatCardProps {
  title: string;
  subtitle: string;
  unit: string;
  value: string;
  children: ReactNode;
}

export default function ReportStatCard({ title, subtitle, unit, value, children }: ReportStatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <p className="text-base font-bold text-charcoal-900">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      <div className="flex items-baseline gap-1 mt-3 mb-3">
        <span className="text-2xl font-extrabold" style={{ color: "#D9A05B" }}>
          {value}
        </span>
        <span className="text-sm font-bold text-gray-400">{unit}</span>
      </div>
      {children}
    </div>
  );
}
