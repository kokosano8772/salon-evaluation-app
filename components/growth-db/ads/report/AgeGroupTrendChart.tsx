"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AGE_GROUPS, AGE_GROUP_CHART_COLOR } from "@/lib/growth-db/ad-report-types";
import { AgeGroupTrendPoint } from "@/lib/growth-db/ad-report-trend";
import { formatMonthShortLabel } from "@/lib/growth-db/format";

interface TooltipPayload {
  payload: AgeGroupTrendPoint;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const p = payload[0].payload;
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg">
        <p className="font-semibold text-sm text-charcoal-900">{formatMonthShortLabel(p.yearMonth)}</p>
        <div className="mt-1 space-y-0.5">
          {AGE_GROUPS.map((g) => (
            <p key={g} className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: AGE_GROUP_CHART_COLOR[g] }} />
              {g}歳 <span className="font-semibold text-charcoal-900">{p[g]}</span>回
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function AgeGroupTrendChart({ data }: { data: AgeGroupTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="yearMonth"
          tickFormatter={formatMonthShortLabel}
          tick={{ fontSize: 11, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }}
          axisLine={{ stroke: "#eee" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }}
          axisLine={false}
          tickLine={false}
          width={36}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'Noto Sans JP', sans-serif" }} formatter={(value: string) => `${value}歳`} />
        {AGE_GROUPS.map((g, i) => (
          <Bar
            key={g}
            dataKey={g}
            stackId="age"
            fill={AGE_GROUP_CHART_COLOR[g]}
            stroke="#fff"
            strokeWidth={1}
            radius={i === AGE_GROUPS.length - 1 ? [4, 4, 0, 0] : undefined}
            maxBarSize={48}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
