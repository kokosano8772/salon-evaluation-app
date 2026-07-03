import FormSection from "./FormSection";
import NumberField from "./NumberField";
import PercentField from "./PercentField";
import { RevenueMetrics } from "@/lib/growth-db/types";

export default function RevenueForm({
  value,
  onChange,
}: {
  value: RevenueMetrics;
  onChange: (value: RevenueMetrics) => void;
}) {
  const set = <K extends keyof RevenueMetrics>(key: K, v: RevenueMetrics[K]) => onChange({ ...value, [key]: v });

  return (
    <FormSection title="売上" description="当月の売上・来店実績">
      <NumberField label="総売上" value={value.totalRevenue} onChange={(v) => set("totalRevenue", v)} suffix="円" />
      <NumberField label="技術売上" value={value.technicalRevenue} onChange={(v) => set("technicalRevenue", v)} suffix="円" />
      <NumberField label="店販売上" value={value.retailRevenue} onChange={(v) => set("retailRevenue", v)} suffix="円" />
      <NumberField label="客単価" value={value.averageUnitPrice} onChange={(v) => set("averageUnitPrice", v)} suffix="円" />
      <NumberField label="総来店数" value={value.totalVisits} onChange={(v) => set("totalVisits", v)} suffix="名" />
      <NumberField label="新規" value={value.newCustomers} onChange={(v) => set("newCustomers", v)} suffix="名" />
      <NumberField label="既存" value={value.existingCustomers} onChange={(v) => set("existingCustomers", v)} suffix="名" />
      <PercentField label="前年比" value={value.yoyRate} onChange={(v) => set("yoyRate", v)} />
    </FormSection>
  );
}
