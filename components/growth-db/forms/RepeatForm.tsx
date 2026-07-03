import FormSection from "./FormSection";
import NumberField from "./NumberField";
import PercentField from "./PercentField";
import { RepeatMetrics } from "@/lib/growth-db/types";

export default function RepeatForm({
  value,
  onChange,
}: {
  value: RepeatMetrics;
  onChange: (value: RepeatMetrics) => void;
}) {
  const set = <K extends keyof RepeatMetrics>(key: K, v: RepeatMetrics[K]) => onChange({ ...value, [key]: v });

  return (
    <FormSection title="リピート" description="再来店・定着に関する指標">
      <PercentField label="初回来店率" value={value.firstVisitRate} onChange={(v) => set("firstVisitRate", v)} />
      <PercentField label="3回来店率" value={value.thirdVisitRate} onChange={(v) => set("thirdVisitRate", v)} />
      <PercentField label="既存リピート率" value={value.existingRepeatRate} onChange={(v) => set("existingRepeatRate", v)} />
      <NumberField label="来店周期" value={value.visitCycleDays} onChange={(v) => set("visitCycleDays", v)} suffix="日" />
      <PercentField label="失客率" value={value.churnRate} onChange={(v) => set("churnRate", v)} />
      <PercentField label="次回予約率" value={value.nextBookingRate} onChange={(v) => set("nextBookingRate", v)} />
      <PercentField label="LINE登録率" value={value.lineRegistrationRate} onChange={(v) => set("lineRegistrationRate", v)} />
      <PercentField label="指名率" value={value.designationRate} onChange={(v) => set("designationRate", v)} />
    </FormSection>
  );
}
