"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { GENDER_CHART_COLOR, GenderBreakdownValue } from "@/lib/growth-db/ad-report-types";

const GENDER_LABEL: Record<keyof GenderBreakdownValue, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};
const GENDER_ORDER: (keyof GenderBreakdownValue)[] = ["male", "female", "other"];

export default function CtrByGenderChart({ value }: { value: GenderBreakdownValue }) {
  const data = GENDER_ORDER.map((key) => ({ key, name: GENDER_LABEL[key], ctr: value[key] }));
  const max = Math.max(...data.map((d) => d.ctr), 0.1);

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#999", fontFamily: "'Noto Sans JP', sans-serif" }}
          axisLine={{ stroke: "#eee" }}
          tickLine={false}
        />
        <YAxis hide domain={[0, max * 1.3]} />
        <Bar dataKey="ctr" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((d) => (
            <Cell key={d.key} fill={GENDER_CHART_COLOR[d.key]} />
          ))}
          <LabelList
            dataKey="ctr"
            position="top"
            formatter={(v) => `${Number(v).toFixed(2)}%`}
            style={{ fontSize: 11, fill: "#434343", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
