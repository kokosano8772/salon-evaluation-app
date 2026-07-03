import FormSection from "./FormSection";
import NumberField from "./NumberField";
import PercentField from "./PercentField";
import { GoogleBusinessMetrics } from "@/lib/growth-db/types";

export default function GoogleBusinessForm({
  value,
  onChange,
}: {
  value: GoogleBusinessMetrics;
  onChange: (value: GoogleBusinessMetrics) => void;
}) {
  const set = <K extends keyof GoogleBusinessMetrics>(key: K, v: GoogleBusinessMetrics[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <FormSection title="Googleビジネス" description="Googleビジネスプロフィールの運用実績">
      <NumberField label="口コミ数" value={value.reviewCount} onChange={(v) => set("reviewCount", v)} suffix="件" />
      <NumberField label="平均評価" value={value.averageRating} onChange={(v) => set("averageRating", v)} step={0.1} />
      <NumberField label="閲覧数" value={value.views} onChange={(v) => set("views", v)} suffix="回" />
      <NumberField label="電話数" value={value.calls} onChange={(v) => set("calls", v)} suffix="件" />
      <NumberField label="ルート検索" value={value.routeSearches} onChange={(v) => set("routeSearches", v)} suffix="件" />
      <NumberField label="WEBクリック" value={value.webClicks} onChange={(v) => set("webClicks", v)} suffix="件" />
      <NumberField label="投稿数" value={value.postCount} onChange={(v) => set("postCount", v)} suffix="件" />
      <NumberField label="写真数" value={value.photoCount} onChange={(v) => set("photoCount", v)} suffix="枚" />
      <PercentField label="返信率" value={value.replyRate} onChange={(v) => set("replyRate", v)} />
    </FormSection>
  );
}
