import { ReactNode } from "react";

interface GoogleReportStatCardProps {
  icon: ReactNode;
  title: string;
  value: string;
  unit: string;
  description?: string;
  accent: string;
  children?: ReactNode;
}

export default function GoogleReportStatCard({ icon, title, value, unit, description, accent, children }: GoogleReportStatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 h-full flex flex-col">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5"
        style={{ backgroundColor: `${accent}26`, color: accent }}
      >
        {icon}
      </div>
      <p className="text-sm font-bold text-charcoal-900 whitespace-pre-line leading-snug">{title}</p>
      <div className="mt-1.5">
        <span className="text-3xl font-extrabold text-charcoal-900">{value}</span>
        <span className="text-sm font-bold ml-1 text-charcoal-700">{unit}</span>
      </div>
      {description && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>}
      {children && <div className="mt-1.5">{children}</div>}
    </div>
  );
}
