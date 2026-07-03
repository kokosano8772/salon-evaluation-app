"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatMonthShortLabel } from "@/lib/growth-db/format";

// 固定順の識別色（既存の6カテゴリカラーと同じセットを流用し、世界観を統一）
export const SERIES_COLORS = ["#C4788A", "#7C9EB5", "#9B8DBF", "#6BAB8A", "#E08B6B", "#5B9BD5"];

export interface StoreSeries {
  storeId: string;
  name: string;
}

interface MultiStoreTrendChartProps {
  months: string[];
  series: StoreSeries[];
  // dataByStore[storeId][yearMonth] = score
  dataByStore: Record<string, Record<string, number | undefined>>;
}

export default function MultiStoreTrendChart({ months, series, dataByStore }: MultiStoreTrendChartProps) {
  const data = months.map((yearMonth) => {
    const row: Record<string, string | number> = { yearMonth };
    series.forEach((s) => {
      const v = dataByStore[s.storeId]?.[yearMonth];
      if (v !== undefined) row[s.storeId] = v;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
        <Tooltip
          labelFormatter={(v) => formatMonthShortLabel(String(v))}
          contentStyle={{ borderRadius: 12, border: "1px solid #f0f0f0", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Line
            key={s.storeId}
            type="monotone"
            dataKey={s.storeId}
            name={s.name}
            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
