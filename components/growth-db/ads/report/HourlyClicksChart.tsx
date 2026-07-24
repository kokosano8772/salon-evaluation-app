"use client";

import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HourlyClicks } from "@/lib/growth-db/ad-report-types";

function stoppedRanges(slots: HourlyClicks[]): { from: string; to: string }[] {
  const ranges: { from: string; to: string }[] = [];
  let start: number | null = null;
  slots.forEach((slot, i) => {
    if (slot.stopped && start === null) start = i;
    if (!slot.stopped && start !== null) {
      ranges.push({ from: slots[start].hour, to: slots[i - 1].hour });
      start = null;
    }
  });
  if (start !== null) ranges.push({ from: slots[start].hour, to: slots[slots.length - 1].hour });
  return ranges;
}

interface TooltipPayload {
  payload: HourlyClicks;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const p = payload[0].payload;
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg">
        <p className="font-semibold text-sm text-charcoal-900">{p.hour}時</p>
        <p className="text-gray-500 text-xs mt-0.5">
          クリック数 <span className="font-semibold" style={{ color: "#D9A05B" }}>{p.clicks}</span> 回
          {p.stopped ? "（配信停止）" : ""}
        </p>
      </div>
    );
  }
  return null;
};

export default function HourlyClicksChart({ data }: { data: HourlyClicks[] }) {
  const ranges = stoppedRanges(data);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 10, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }}
          axisLine={{ stroke: "#eee" }}
          tickLine={false}
          interval={1}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }}
          axisLine={false}
          tickLine={false}
          width={32}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        {ranges.map((r) => (
          <ReferenceArea
            key={r.from}
            x1={r.from}
            x2={r.to}
            fill="#8a8a8a"
            fillOpacity={0.35}
            label={{ value: "配信停止", position: "insideTop", fontSize: 10, fill: "#fff" }}
          />
        ))}
        <Line
          type="monotone"
          dataKey="clicks"
          stroke="#D9A05B"
          strokeWidth={2}
          dot={{ r: 3, fill: "#D9A05B", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
