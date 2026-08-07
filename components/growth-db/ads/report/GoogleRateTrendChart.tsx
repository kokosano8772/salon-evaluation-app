"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ConversionRateTrendPoint } from "@/lib/growth-db/ad-report-trend";
import { formatMonthShortLabel } from "@/lib/growth-db/format";

interface GoogleRateTrendChartProps {
  currentSeries: ConversionRateTrendPoint[];
  // 前年同期比較（集客のみ）。指定が無ければ1系列のみ表示する。
  previousSeries?: ConversionRateTrendPoint[];
  target?: number;
  accent: string;
}

interface MergedPoint {
  index: number;
  currentLabel?: string;
  currentRate?: number;
  previousLabel?: string;
  previousRate?: number;
}

const PREVIOUS_COLOR = "#B9B2C7";

interface TooltipPayload {
  payload?: MergedPoint;
}

function makeTooltip(accent: string) {
  return function CustomTooltip({ active, payload }: { active?: boolean; payload?: readonly TooltipPayload[] }) {
    const p = payload?.[0]?.payload;
    if (active && p) {
      return (
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg">
          <p className="font-semibold text-sm text-charcoal-900">{p.currentLabel ? formatMonthShortLabel(p.currentLabel) : ""}</p>
          {p.currentRate !== undefined && (
            <p className="text-gray-500 text-xs mt-0.5">
              直近12ヶ月 <span className="font-semibold" style={{ color: accent }}>{p.currentRate.toFixed(2)}</span>%
            </p>
          )}
          {p.previousRate !== undefined && (
            <p className="text-gray-500 text-xs mt-0.5">
              前年同期 <span className="font-semibold" style={{ color: PREVIOUS_COLOR }}>{p.previousRate.toFixed(2)}</span>%
            </p>
          )}
        </div>
      );
    }
    return null;
  };
}

export default function GoogleRateTrendChart({ currentSeries, previousSeries, target, accent }: GoogleRateTrendChartProps) {
  if (currentSeries.length === 0) {
    return <p className="text-sm text-gray-300 py-12 text-center">データ未入力</p>;
  }

  // 前年同期比較は「同じ相対位置（直近12ヶ月中の何ヶ月目か）」でインデックス揃えして重ねる
  // （実際のカレンダー月は前年側とずれるため、位置基準で並べる）。
  const length = Math.max(currentSeries.length, previousSeries?.length ?? 0);
  const merged: MergedPoint[] = Array.from({ length }, (_, i) => ({
    index: i,
    currentLabel: currentSeries[i]?.yearMonth,
    currentRate: currentSeries[i]?.rate,
    previousLabel: previousSeries?.[i]?.yearMonth,
    previousRate: previousSeries?.[i]?.rate,
  }));

  return (
    <ResponsiveContainer width="100%" height={170}>
      <LineChart data={merged} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="index"
          tickFormatter={(i: number) => (merged[i]?.currentLabel ? formatMonthShortLabel(merged[i].currentLabel!) : "")}
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
        <Tooltip content={makeTooltip(accent)} />
        {target !== undefined && (
          <ReferenceLine y={target} stroke="#C9BFA8" strokeDasharray="4 4" label={{ value: `目標値: ${target}%`, fontSize: 10, fill: "#999" }} />
        )}
        {previousSeries && (
          <Line
            type="monotone"
            dataKey="previousRate"
            name="前年同期"
            stroke={PREVIOUS_COLOR}
            strokeWidth={2}
            dot={{ r: 3, fill: PREVIOUS_COLOR, strokeWidth: 0 }}
            isAnimationActive={false}
            connectNulls
          />
        )}
        <Line
          type="monotone"
          dataKey="currentRate"
          name="直近12ヶ月"
          stroke={accent}
          strokeWidth={2}
          dot={{ r: 3, fill: accent, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
