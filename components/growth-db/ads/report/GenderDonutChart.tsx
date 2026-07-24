"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { GENDER_CHART_COLOR, GenderBreakdownValue } from "@/lib/growth-db/ad-report-types";

const GENDER_LABEL: Record<keyof GenderBreakdownValue, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};
const GENDER_ORDER: (keyof GenderBreakdownValue)[] = ["male", "female", "other"];

interface TooltipPayload {
  payload: { name: string; value: number; percent: number };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const p = payload[0].payload;
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-lg">
        <p className="font-semibold text-sm text-charcoal-900">{p.name}</p>
        <p className="text-gray-500 text-xs mt-0.5">{p.percent.toFixed(1)}%（{p.value.toLocaleString("ja-JP")}）</p>
      </div>
    );
  }
  return null;
};

export default function GenderDonutChart({ value }: { value: GenderBreakdownValue }) {
  const total = value.male + value.female + value.other;
  const data = GENDER_ORDER.map((key) => ({
    key,
    name: GENDER_LABEL[key],
    value: value[key],
    percent: total > 0 ? (value[key] / total) * 100 : 0,
  })).filter((d) => d.value > 0);

  if (total <= 0) {
    return <div className="h-32 flex items-center justify-center text-xs text-gray-300">データ未入力</div>;
  }

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={130} height={130}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={36} outerRadius={58} paddingAngle={1} strokeWidth={0}>
            {data.map((d) => (
              <Cell key={d.key} fill={GENDER_CHART_COLOR[d.key]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="space-y-1.5">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: GENDER_CHART_COLOR[d.key] }} />
            <span className="text-gray-500">{d.name}</span>
            <span className="font-semibold text-charcoal-900">{d.percent.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
