import FormSection from "./FormSection";
import NumberField from "./NumberField";
import { SnsMetrics } from "@/lib/growth-db/types";

export default function SnsForm({ value, onChange }: { value: SnsMetrics; onChange: (value: SnsMetrics) => void }) {
  const setIg = <K extends keyof SnsMetrics["instagram"]>(key: K, v: SnsMetrics["instagram"][K]) =>
    onChange({ ...value, instagram: { ...value.instagram, [key]: v } });
  const setTk = <K extends keyof SnsMetrics["tiktok"]>(key: K, v: SnsMetrics["tiktok"][K]) =>
    onChange({ ...value, tiktok: { ...value.tiktok, [key]: v } });

  return (
    <div className="space-y-6">
      <FormSection title="SNS（Instagram）" description="公式アカウントの運用実績">
        <NumberField label="フォロワー" value={value.instagram.followers} onChange={(v) => setIg("followers", v)} suffix="人" />
        <NumberField label="投稿数" value={value.instagram.posts} onChange={(v) => setIg("posts", v)} suffix="件" />
        <NumberField label="保存数" value={value.instagram.saves} onChange={(v) => setIg("saves", v)} suffix="件" />
        <NumberField label="リール投稿数" value={value.instagram.reels} onChange={(v) => setIg("reels", v)} suffix="本" />
        <NumberField label="プロフィールアクセス" value={value.instagram.profileAccess} onChange={(v) => setIg("profileAccess", v)} suffix="回" />
        <NumberField label="LINE遷移数" value={value.instagram.lineReferrals} onChange={(v) => setIg("lineReferrals", v)} suffix="件" />
      </FormSection>

      <FormSection title="SNS（TikTok）" description="公式アカウントの運用実績">
        <NumberField label="フォロワー" value={value.tiktok.followers} onChange={(v) => setTk("followers", v)} suffix="人" />
        <NumberField label="再生数" value={value.tiktok.views} onChange={(v) => setTk("views", v)} suffix="回" />
        <NumberField label="問い合わせ数" value={value.tiktok.inquiries} onChange={(v) => setTk("inquiries", v)} suffix="件" />
      </FormSection>
    </div>
  );
}
