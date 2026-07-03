import FormSection from "./FormSection";
import NumberField from "./NumberField";
import PercentField from "./PercentField";
import { BrandMetrics } from "@/lib/growth-db/types";

export default function BrandForm({
  value,
  onChange,
}: {
  value: BrandMetrics;
  onChange: (value: BrandMetrics) => void;
}) {
  const set = <K extends keyof BrandMetrics>(key: K, v: BrandMetrics[K]) => onChange({ ...value, [key]: v });

  return (
    <FormSection title="ブランド" description="認知・信頼に関する指標">
      <NumberField label="Google評価" value={value.googleRating} onChange={(v) => set("googleRating", v)} step={0.1} />
      <PercentField label="紹介率" value={value.referralRate} onChange={(v) => set("referralRate", v)} />
      <NumberField label="NPS" value={value.nps} onChange={(v) => set("nps", v)} />
      <NumberField label="アンケート満足度" value={value.satisfactionScore} onChange={(v) => set("satisfactionScore", v)} />
      <NumberField label="ブランド検索数" value={value.brandSearchVolume} onChange={(v) => set("brandSearchVolume", v)} suffix="件" />
      <NumberField label="指名検索数" value={value.designationSearchVolume} onChange={(v) => set("designationSearchVolume", v)} suffix="件" />
    </FormSection>
  );
}
