"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { YoyCyclePoint } from "@/lib/growth-db/ad-report-trend";
import { formatMonthShortLabel } from "@/lib/growth-db/format";

interface GoogleRateTrendChartProps {
  previousCycle: YoyCyclePoint[];
  currentCycle: YoyCyclePoint[];
  previousLabel: string;
  currentLabel: string;
  target?: number;
  previousColor: string;
  currentColor: string;
}

interface MergedPoint {
  index: number;
  previousLabel?: string;
  previousRate?: number | null;
  currentLabel?: string;
  currentRate?: number | null;
}

interface TooltipPayload {
  payload?: MergedPoint;
}

function makeTooltip(previousColor: string, currentColor: string, previousLegend: string, currentLegend: string) {
  return function CustomTooltip({ active, payload }: { active?: boolean; payload?: readonly TooltipPayload[] }) {
    const p = payload?.[0]?.payload;
    if (active && p) {
      return (
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg">
          {p.currentRate != null && (
            <p className="text-gray-500 text-xs">
              {currentLegend}（{p.currentLabel && formatMonthShortLabel(p.currentLabel)}） <span className="font-semibold" style={{ color: currentColor }}>{p.currentRate.toFixed(2)}</span>%
            </p>
          )}
          {p.previousRate != null && (
            <p className="text-gray-500 text-xs mt-0.5">
              {previousLegend}（{p.previousLabel && formatMonthShortLabel(p.previousLabel)}） <span className="font-semibold" style={{ color: previousColor }}>{p.previousRate.toFixed(2)}</span>%
            </p>
          )}
        </div>
      );
    }
    return null;
  };
}

export default function GoogleRateTrendChart({
  previousCycle,
  currentCycle,
  previousLabel,
  currentLabel,
  target,
  previousColor,
  currentColor,
}: GoogleRateTrendChartProps) {
  const hasPrevious = previousCycle.some((p) => p.rate != null);
  const hasCurrent = currentCycle.some((p) => p.rate != null);
  if (!hasPrevious && !hasCurrent) {
    return <p className="text-sm text-gray-300 py-12 text-center">データ未入力</p>;
  }

  const merged: MergedPoint[] = Array.from({ length: 12 }, (_, i) => ({
    index: i,
    previousLabel: previousCycle[i]?.yearMonth,
    previousRate: previousCycle[i]?.rate,
    currentLabel: currentCycle[i]?.yearMonth,
    currentRate: currentCycle[i]?.rate,
  }));

  return (
    <div>
      <div className="flex items-center justify-end gap-4 mb-1 text-xs text-gray-500">
        {hasPrevious && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: previousColor }} />
            {previousLabel}
          </span>
        )}
        {hasCurrent && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: currentColor }} />
            {currentLabel}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={merged} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="index"
            tickFormatter={(i: number) => {
              const ym = merged[i]?.previousLabel ?? merged[i]?.currentLabel;
              return ym ? formatMonthShortLabel(ym) : "";
            }}
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
          <Tooltip content={makeTooltip(previousColor, currentColor, previousLabel, currentLabel)} />
          {target !== undefined && (
            <ReferenceLine y={target} stroke="#C9BFA8" strokeDasharray="4 4" label={{ value: `目標値: ${target}%`, fontSize: 10, fill: "#999" }} />
          )}
          {hasPrevious && (
            <Line
              type="monotone"
              dataKey="previousRate"
              stroke={previousColor}
              strokeWidth={2}
              dot={{ r: 3, fill: previousColor, strokeWidth: 0 }}
              isAnimationActive={false}
              connectNulls
            />
          )}
          {hasCurrent && (
            <Line
              type="monotone"
              dataKey="currentRate"
              stroke={currentColor}
              strokeWidth={2}
              dot={{ r: 3, fill: currentColor, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
