"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AD_REPORT_ACCENT_COLOR } from "@/lib/growth-db/ad-report-types";
import { CtrTrendPoint } from "@/lib/growth-db/ad-report-trend";
import { formatMonthShortLabel } from "@/lib/growth-db/format";

interface TooltipPayload {
  payload: CtrTrendPoint;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const p = payload[0].payload;
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg">
        <p className="font-semibold text-sm text-charcoal-900">{formatMonthShortLabel(p.yearMonth)}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          CTR <span className="font-semibold" style={{ color: AD_REPORT_ACCENT_COLOR }}>{p.ctr.toFixed(2)}</span> %
        </p>
      </div>
    );
  }
  return null;
};

export default function AnnualCtrChart({ data }: { data: CtrTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="yearMonth"
          tickFormatter={formatMonthShortLabel}
          tick={{ fontSize: 11, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }}
          axisLine={{ stroke: "#eee" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="linear"
          dataKey="ctr"
          stroke={AD_REPORT_ACCENT_COLOR}
          strokeWidth={2}
          dot={{ r: 3, fill: AD_REPORT_ACCENT_COLOR, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
