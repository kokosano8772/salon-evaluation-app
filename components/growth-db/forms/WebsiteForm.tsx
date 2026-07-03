import FormSection from "./FormSection";
import NumberField from "./NumberField";
import CheckboxField from "./CheckboxField";
import { WebsiteMetrics } from "@/lib/growth-db/types";

export default function WebsiteForm({
  value,
  onChange,
}: {
  value: WebsiteMetrics;
  onChange: (value: WebsiteMetrics) => void;
}) {
  const set = <K extends keyof WebsiteMetrics>(key: K, v: WebsiteMetrics[K]) => onChange({ ...value, [key]: v });

  return (
    <FormSection title="ホームページ" description="自社サイトのコンテンツ整備状況">
      <NumberField label="SEO記事数" value={value.seoArticleCount} onChange={(v) => set("seoArticleCount", v)} suffix="本" />
      <NumberField label="サービスページ数" value={value.servicePageCount} onChange={(v) => set("servicePageCount", v)} suffix="P" />
      <NumberField label="FAQ数" value={value.faqCount} onChange={(v) => set("faqCount", v)} suffix="件" />
      <NumberField label="事例数" value={value.caseStudyCount} onChange={(v) => set("caseStudyCount", v)} suffix="件" />
      <NumberField label="お客様の声" value={value.testimonialCount} onChange={(v) => set("testimonialCount", v)} suffix="件" />
      <div className="sm:col-span-2 flex gap-6">
        <CheckboxField label="スタッフページあり" checked={value.hasStaffPage} onChange={(v) => set("hasStaffPage", v)} />
        <CheckboxField label="AI検索に掲載あり" checked={value.aiSearchListed} onChange={(v) => set("aiSearchListed", v)} />
      </div>
    </FormSection>
  );
}
