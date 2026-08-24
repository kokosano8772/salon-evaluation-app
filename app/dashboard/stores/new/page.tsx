"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BasicInfoForm, { BasicInfoValue } from "@/components/growth-db/forms/BasicInfoForm";
import { AREAS, TARGET_CUSTOMER_OPTIONS } from "@/lib/growth-db/constants";
import * as repo from "@/lib/growth-db/repository";

const INITIAL_VALUE: BasicInfoValue = {
  name: "",
  phone: "",
  area: AREAS[0],
  openedYear: new Date().getFullYear(),
  storeCount: 1,
  seatCount: 6,
  businessHours: "10:00〜19:00",
  businessDays: "水曜定休",
  staffCount: 5,
  targetCustomer: TARGET_CUSTOMER_OPTIONS[0],
  averageUnitPrice: 8000,
  tradeArea: "",
  storeFormat: "",
  businessCategory: "",
  homepageUrl: "",
  hotpepperUrl: "",
  googleAdsActive: false,
  metaAdsActive: false,
};

export default function NewStorePage() {
  const router = useRouter();
  const [value, setValue] = useState<BasicInfoValue>(INITIAL_VALUE);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!value.name.trim()) return;
    setSubmitting(true);
    const store = await repo.createStore(value);
    router.push(`/dashboard/stores/${store.id}/data`);
  };

  return (
    <div>
      <DashboardHeader
        title="店舗を追加"
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "成長データベース", href: "/dashboard/stores" },
          { label: "店舗を追加" },
        ]}
      />

      <div className="max-w-2xl">
        <BasicInfoForm value={value} onChange={setValue} />

        <button
          onClick={handleSubmit}
          disabled={submitting || !value.name.trim()}
          className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          {submitting ? "登録中..." : "店舗を登録する"}
        </button>
      </div>
    </div>
  );
}
