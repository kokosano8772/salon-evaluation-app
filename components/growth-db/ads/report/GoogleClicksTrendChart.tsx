"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";
import { ClicksTrendPoint } from "@/lib/growth-db/ad-report-trend";
import { formatMonthShortLabel } from "@/lib/growth-db/format";

interface TooltipPayload {
  payload: ClicksTrendPoint;
}

interface BarLabelProps {
  x?: string | number;
  y?: string | number;
  width?: string | number;
  value?: string | number | boolean | null;
}

function renderClicksLabel({ x, y, width, value }: BarLabelProps) {
  if (x === undefined || y === undefined || width === undefined || value === undefined || value === null || typeof value === "boolean") {
    return null;
  }
  const cx = Number(x) + Number(width) / 2;
  const cy = Number(y) - 6;
  return (
    <text x={cx} y={cy} textAnchor="middle" fontSize={10} fontFamily="'Noto Sans JP', sans-serif" fill="#999">
      {Number(value)}回
    </text>
  );
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const p = payload[0].payload;
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg">
        <p className="font-semibold text-sm text-charcoal-900">{formatMonthShortLabel(p.yearMonth)}</p>
        <p className="text-gray-500 text-xs mt-0.5">クリック数 {p.clicks}回</p>
      </div>
    );
  }
  return null;
};

export default function GoogleClicksTrendChart({ data, accent }: { data: ClicksTrendPoint[]; accent: string }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-300 py-12 text-center">データ未入力</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="yearMonth"
          tickFormatter={formatMonthShortLabel}
          tick={{ fontSize: 11, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }}
          axisLine={{ stroke: "#eee" }}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="clicks" fill={accent} radius={[4, 4, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey="clicks" content={renderClicksLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
