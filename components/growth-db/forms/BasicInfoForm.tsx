import FormSection from "./FormSection";
import TextField from "./TextField";
import NullableNumberField from "./NullableNumberField";
import SelectField from "./SelectField";
import CheckboxField from "./CheckboxField";
import { TARGET_CUSTOMER_OPTIONS, TRADE_AREA_OPTIONS, STORE_FORMAT_OPTIONS } from "@/lib/growth-db/constants";
import { Store } from "@/lib/growth-db/types";

export type BasicInfoValue = Omit<Store, "id" | "createdAt" | "updatedAt">;

interface BasicInfoFormProps {
  value: BasicInfoValue;
  onChange: (value: BasicInfoValue) => void;
}

export default function BasicInfoForm({ value, onChange }: BasicInfoFormProps) {
  const set = <K extends keyof BasicInfoValue>(key: K, v: BasicInfoValue[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <FormSection title="基本情報" description="店舗の基本プロフィール">
      <TextField label="店舗名" value={value.name} onChange={(v) => set("name", v)} />
      <TextField label="電話番号" value={value.phone} onChange={(v) => set("phone", v)} placeholder="09012345678" />
      <TextField label="エリア" value={value.area} onChange={(v) => set("area", v)} placeholder="例: 渋谷区" />
      <NullableNumberField label="開業年" value={value.openedYear} onChange={(v) => set("openedYear", v)} suffix="年" />
      <NullableNumberField label="店舗数" value={value.storeCount} onChange={(v) => set("storeCount", v)} suffix="店舗" />
      <NullableNumberField label="席数" value={value.seatCount} onChange={(v) => set("seatCount", v)} suffix="席" />
      <NullableNumberField label="スタッフ数" value={value.staffCount} onChange={(v) => set("staffCount", v)} suffix="名" />
      <TextField label="営業時間" value={value.businessHours} onChange={(v) => set("businessHours", v)} />
      <TextField label="営業日" value={value.businessDays} onChange={(v) => set("businessDays", v)} />
      <SelectField
        label="ターゲット"
        value={value.targetCustomer}
        onChange={(v) => set("targetCustomer", v)}
        options={TARGET_CUSTOMER_OPTIONS}
      />
      <NullableNumberField
        label="平均単価"
        value={value.averageUnitPrice}
        onChange={(v) => set("averageUnitPrice", v)}
        suffix="円"
      />
      <SelectField
        label="商圏"
        value={value.tradeArea}
        onChange={(v) => set("tradeArea", v)}
        options={TRADE_AREA_OPTIONS}
        placeholder="未設定"
      />
      <SelectField
        label="店舗形態"
        value={value.storeFormat}
        onChange={(v) => set("storeFormat", v)}
        options={STORE_FORMAT_OPTIONS}
        placeholder="未設定"
      />
      <div className="sm:col-span-2 flex flex-wrap gap-x-6">
        <CheckboxField label="Google広告を実施中" checked={value.googleAdsActive} onChange={(v) => set("googleAdsActive", v)} />
        <CheckboxField label="インスタ広告（Meta広告）を実施中" checked={value.metaAdsActive} onChange={(v) => set("metaAdsActive", v)} />
      </div>
    </FormSection>
  );
}
