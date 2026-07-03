import FormSection from "./FormSection";
import NumberField from "./NumberField";
import PercentField from "./PercentField";
import { RetentionMetrics } from "@/lib/growth-db/types";

export default function RetentionForm({
  value,
  onChange,
}: {
  value: RetentionMetrics;
  onChange: (value: RetentionMetrics) => void;
}) {
  const set = <K extends keyof RetentionMetrics>(key: K, v: RetentionMetrics[K]) => onChange({ ...value, [key]: v });

  return (
    <FormSection title="定着" description="スタッフの定着・組織の仕組み化度合い（整備度は0〜3で入力）">
      <PercentField label="1年定着率" value={value.oneYearRetentionRate} onChange={(v) => set("oneYearRetentionRate", v)} />
      <PercentField label="3年定着率" value={value.threeYearRetentionRate} onChange={(v) => set("threeYearRetentionRate", v)} />
      <PercentField label="離職率" value={value.turnoverRate} onChange={(v) => set("turnoverRate", v)} />
      <NumberField label="店長数" value={value.managerCount} onChange={(v) => set("managerCount", v)} suffix="名" />
      <NumberField label="幹部数" value={value.executiveCount} onChange={(v) => set("executiveCount", v)} suffix="名" />
      <NumberField label="教育制度整備度" value={value.educationSystemLevel} onChange={(v) => set("educationSystemLevel", Math.min(3, Math.max(0, v)))} />
      <NumberField label="評価制度整備度" value={value.evaluationSystemLevel} onChange={(v) => set("evaluationSystemLevel", Math.min(3, Math.max(0, v)))} />
      <NumberField label="マニュアル整備度" value={value.manualLevel} onChange={(v) => set("manualLevel", Math.min(3, Math.max(0, v)))} />
    </FormSection>
  );
}
