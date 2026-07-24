"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { GENDER_CHART_COLOR, GenderBreakdownValue } from "@/lib/growth-db/ad-report-types";

const GENDER_LABEL: Record<keyof GenderBreakdownValue, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};
// 元テンプレートと同じ並び（12時位置から時計回りに その他→男性→女性）
const GENDER_ORDER: (keyof GenderBreakdownValue)[] = ["other", "male", "female"];

const RADIAN = Math.PI / 180;

interface OuterLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  name?: string;
}

// html2canvas はSVGの dominantBaseline / tspan(dy) の文字位置指定を正しく
// ラスタライズできない（画面表示では見えるがPDF化すると文字が消える）ため、
// dy・dominantBaselineを使わず、x/yを直接計算した2つの<text>で組む。
function renderOuterLabel({ cx, cy, midAngle, outerRadius, percent, name }: OuterLabelProps) {
  if (!percent || percent <= 0 || cx === undefined || cy === undefined || midAngle === undefined || outerRadius === undefined) {
    return null;
  }
  const radius = outerRadius + 20;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const anchor = x > cx ? "start" : x < cx ? "end" : "middle";
  return (
    <g>
      <text x={x} y={y - 8} textAnchor={anchor} fontSize={18} fontFamily="'Noto Sans JP', sans-serif" fill="#4b5563">
        {name}
      </text>
      <text x={x} y={y + 16} textAnchor={anchor} fontSize={20} fontWeight={700} fontFamily="'Noto Sans JP', sans-serif" fill="#1a1a1a">
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
}

interface TooltipPayload {
  name: string;
  value: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const p = payload[0];
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg">
        <p className="font-semibold text-sm text-charcoal-900">{p.name}</p>
        <p className="text-gray-500 text-xs mt-0.5">{p.value.toLocaleString("ja-JP")}</p>
      </div>
    );
  }
  return null;
};

export default function GenderDonutChart({ value }: { value: GenderBreakdownValue }) {
  const total = value.male + value.female + value.other;
  const data = GENDER_ORDER.map((key) => ({ key, name: GENDER_LABEL[key], value: value[key] })).filter((d) => d.value > 0);

  if (total <= 0) {
    return <div className="h-64 flex items-center justify-center text-xs text-gray-300">データ未入力</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={340}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          startAngle={90}
          endAngle={-270}
          innerRadius={50}
          outerRadius={84}
          paddingAngle={1}
          strokeWidth={0}
          label={renderOuterLabel}
          labelLine={{ stroke: "#d4d4d4" }}
          isAnimationActive={false}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={GENDER_CHART_COLOR[d.key]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
