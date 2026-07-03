import FormSection from "./FormSection";
import PercentField from "./PercentField";
import { ManagementMetrics } from "@/lib/growth-db/types";

export default function ManagementForm({
  value,
  onChange,
}: {
  value: ManagementMetrics;
  onChange: (value: ManagementMetrics) => void;
}) {
  const set = <K extends keyof ManagementMetrics>(key: K, v: ManagementMetrics[K]) => onChange({ ...value, [key]: v });

  return (
    <FormSection title="経営" description="収益構造に関する比率指標">
      <PercentField label="家賃比率" value={value.rentRatio} onChange={(v) => set("rentRatio", v)} />
      <PercentField label="人件費率" value={value.laborCostRatio} onChange={(v) => set("laborCostRatio", v)} />
      <PercentField label="広告費率" value={value.adCostRatio} onChange={(v) => set("adCostRatio", v)} />
      <PercentField label="原価率" value={value.costRatio} onChange={(v) => set("costRatio", v)} />
      <PercentField label="営業利益率" value={value.operatingMarginRatio} onChange={(v) => set("operatingMarginRatio", v)} />
    </FormSection>
  );
}
