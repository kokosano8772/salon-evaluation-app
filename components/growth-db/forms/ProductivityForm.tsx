import FormSection from "./FormSection";
import NumberField from "./NumberField";
import PercentField from "./PercentField";
import { ProductivityMetrics } from "@/lib/growth-db/types";

export default function ProductivityForm({
  value,
  onChange,
}: {
  value: ProductivityMetrics;
  onChange: (value: ProductivityMetrics) => void;
}) {
  const set = <K extends keyof ProductivityMetrics>(key: K, v: ProductivityMetrics[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <FormSection title="生産性" description="スタッフ一人あたりの生産性指標">
      <NumberField label="平均売上" value={value.averageRevenue} onChange={(v) => set("averageRevenue", v)} suffix="円" />
      <NumberField label="トップ売上" value={value.topRevenue} onChange={(v) => set("topRevenue", v)} suffix="円" />
      <NumberField label="最低売上" value={value.lowestRevenue} onChange={(v) => set("lowestRevenue", v)} suffix="円" />
      <NumberField label="一人当たり売上" value={value.revenuePerStaff} onChange={(v) => set("revenuePerStaff", v)} suffix="円" />
      <NumberField label="時間売上" value={value.revenuePerHour} onChange={(v) => set("revenuePerHour", v)} suffix="円" />
      <PercentField label="稼働率" value={value.utilizationRate} onChange={(v) => set("utilizationRate", v)} />
      <PercentField label="店販比率" value={value.retailRatio} onChange={(v) => set("retailRatio", v)} />
    </FormSection>
  );
}
