import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accentColor?: string;
  icon?: ReactNode;
}

export default function StatCard({ label, value, sub, accentColor = "#C4788A", icon }: StatCardProps) {
  return (
    <div className="card-luxury p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-400 tracking-wide">{label}</p>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${accentColor}14` }}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-charcoal-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
