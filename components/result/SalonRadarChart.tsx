"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CategoryScore } from "@/lib/types";

interface SalonRadarChartProps {
  categoryScores: CategoryScore[];
  // PDF保存用の静止ドキュメント（DiagnosisPrintDocument）では、Rechartsの入場アニメーション
  // （デフォルトで有効、完了まで約1.5秒）が終わる前にキャプチャされるとポリゴンが
  // 描画されていない状態で写ってしまうため、そちらからは false を渡して無効化する。
  animate?: boolean;
}

interface TooltipPayloadItem {
  payload: { fullMark: number; value: number; name: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const pct = Math.round((data.value / data.fullMark) * 100);
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg">
        <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>
          {data.name}
        </p>
        <p className="text-gray-500 text-xs mt-0.5">
          {data.value} / {data.fullMark}点
          <span className="ml-2 font-semibold" style={{ color: "#C4788A" }}>
            {pct}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function SalonRadarChart({ categoryScores, animate = true }: SalonRadarChartProps) {
  const data = categoryScores.map((cs) => ({
    name: cs.name,
    value: cs.score,
    fullMark: cs.maxScore,
    percentage: cs.percentage,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
        <PolarGrid stroke="#e8e8e8" strokeWidth={1} />
        <PolarAngleAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#555", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}
          tickSize={8}
        />
        <Radar
          name="スコア"
          dataKey="value"
          stroke="#C4788A"
          strokeWidth={2}
          fill="#C4788A"
          fillOpacity={0.18}
          isAnimationActive={animate}
        />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
