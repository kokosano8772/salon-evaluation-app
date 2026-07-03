"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatMonthShortLabel } from "@/lib/growth-db/format";

export interface TrendPoint {
  yearMonth: string;
  score: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: TrendPoint }[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const p = payload[0].payload;
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg">
        <p className="font-semibold text-sm text-charcoal-900">{formatMonthShortLabel(p.yearMonth)}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          総合スコア <span className="font-semibold" style={{ color: "#C4788A" }}>{p.score}</span> 点
        </p>
      </div>
    );
  }
  return null;
};

export default function MonthlyTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="yearMonth"
          tickFormatter={formatMonthShortLabel}
          tick={{ fontSize: 11, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }}
          axisLine={{ stroke: "#eee" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#C4788A"
          strokeWidth={2}
          dot={{ r: 3, fill: "#C4788A", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
