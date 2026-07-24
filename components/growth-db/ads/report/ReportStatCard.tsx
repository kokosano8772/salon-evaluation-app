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
      <p className="text-2xl font-bold text-charcoal-900 text-center">{title}</p>
      <p className="text-base text-gray-400 mt-1 text-center">{subtitle}</p>
      <div className="text-center mt-8 mb-6">
        <span className="text-7xl font-extrabold" style={{ color: AD_REPORT_ACCENT_COLOR }}>
          {value}
        </span>
        <span className="text-3xl font-bold ml-1.5" style={{ color: AD_REPORT_ACCENT_COLOR }}>
          {unit}
        </span>
      </div>
      {children}
    </div>
  );
}
