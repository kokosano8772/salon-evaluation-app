"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";
import { YoyCyclePoint } from "@/lib/growth-db/ad-report-trend";
import { formatMonthShortLabel } from "@/lib/growth-db/format";

interface GoogleClicksTrendChartProps {
  previousCycle: YoyCyclePoint[];
  currentCycle: YoyCyclePoint[];
  previousLabel: string;
  currentLabel: string;
  previousColor: string;
  currentColor: string;
}

interface MergedPoint {
  index: number;
  previousLabel?: string;
  previousClicks?: number | null;
  currentLabel?: string;
  currentClicks?: number | null;
}

interface BarLabelProps {
  x?: string | number;
  y?: string | number;
  width?: string | number;
  value?: string | number | boolean | null;
}

function makeClicksLabel(color: string) {
  return function ClicksLabel({ x, y, width, value }: BarLabelProps) {
    if (x === undefined || y === undefined || width === undefined || value === undefined || value === null || typeof value === "boolean") {
      return null;
    }
    const cx = Number(x) + Number(width) / 2;
    const cy = Number(y) - 6;
    return (
      <text x={cx} y={cy} textAnchor="middle" fontSize={10} fontFamily="'Noto Sans JP', sans-serif" fill={color}>
        {Number(value).toLocaleString()}回
      </text>
    );
  };
}

export default function GoogleClicksTrendChart({
  previousCycle,
  currentCycle,
  previousLabel,
  currentLabel,
  previousColor,
  currentColor,
}: GoogleClicksTrendChartProps) {
  const hasPrevious = previousCycle.some((p) => p.clicks != null);
  const hasCurrent = currentCycle.some((p) => p.clicks != null);
  if (!hasPrevious && !hasCurrent) {
    return <p className="text-sm text-gray-300 py-12 text-center">データ未入力</p>;
  }

  const merged: MergedPoint[] = Array.from({ length: 12 }, (_, i) => ({
    index: i,
    previousLabel: previousCycle[i]?.yearMonth,
    previousClicks: previousCycle[i]?.clicks,
    currentLabel: currentCycle[i]?.yearMonth,
    currentClicks: currentCycle[i]?.clicks,
  }));

  return (
    <div>
      <div className="flex items-center justify-end gap-4 mb-1 text-xs text-gray-500">
        {hasPrevious && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: previousColor }} />
            {previousLabel}
          </span>
        )}
        {hasCurrent && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: currentColor }} />
            {currentLabel}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={112}>
        <BarChart data={merged} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="index"
            tickFormatter={(i: number) => {
              const ym = merged[i]?.previousLabel ?? merged[i]?.currentLabel;
              return ym ? formatMonthShortLabel(ym) : "";
            }}
            tick={{ fontSize: 16, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }}
            axisLine={{ stroke: "#eee" }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            content={({ active, payload }) => {
              const p = (payload?.[0]?.payload ?? null) as MergedPoint | null;
              if (!active || !p) return null;
              return (
                <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg">
                  {p.currentClicks != null && (
                    <p className="text-gray-500 text-xs">
                      {currentLabel} <span className="font-semibold" style={{ color: currentColor }}>{p.currentClicks}</span>回
                    </p>
                  )}
                  {p.previousClicks != null && (
                    <p className="text-gray-500 text-xs mt-0.5">
                      {previousLabel} <span className="font-semibold" style={{ color: previousColor }}>{p.previousClicks}</span>回
                    </p>
                  )}
                </div>
              );
            }}
          />
          {hasPrevious && (
            <Bar dataKey="previousClicks" fill={previousColor} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="previousClicks" content={makeClicksLabel("#999")} />
            </Bar>
          )}
          {hasCurrent && (
            <Bar dataKey="currentClicks" fill={currentColor} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="currentClicks" content={makeClicksLabel(currentColor)} />
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
