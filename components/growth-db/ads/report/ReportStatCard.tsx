import { ReactNode } from "react";
import { AD_REPORT_ACCENT_COLOR } from "@/lib/growth-db/ad-report-types";

interface ReportStatCardProps {
  title: string;
  subtitle: string;
  unit: string;
  value: string;
  children: ReactNode;
}

export default function ReportStatCard({ title, subtitle, unit, value, children }: ReportStatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-8">
      <p className="text-lg font-bold text-charcoal-900">{title}</p>
      <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
      <div className="text-center mt-4 mb-1">
        <span className="text-3xl font-extrabold" style={{ color: AD_REPORT_ACCENT_COLOR }}>
          {value}
        </span>
        <span className="text-lg font-bold ml-0.5" style={{ color: AD_REPORT_ACCENT_COLOR }}>
          {unit}
        </span>
      </div>
      {children}
    </div>
  );
}
