"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import * as repo from "@/lib/growth-db/repository";
import { MonthlyMetrics } from "@/lib/growth-db/types";
import { withDefaults } from "@/lib/growth-db/defaults";
import RevenueForm from "./RevenueForm";
import AcquisitionForm from "./AcquisitionForm";
import RepeatForm from "./RepeatForm";
import GoogleBusinessForm from "./GoogleBusinessForm";
import WebsiteForm from "./WebsiteForm";
import SnsForm from "./SnsForm";
import RecruitingForm from "./RecruitingForm";
import RetentionForm from "./RetentionForm";
import ProductivityForm from "./ProductivityForm";
import BrandForm from "./BrandForm";
import ManagementForm from "./ManagementForm";

interface MonthlyDataFormProps {
  storeId: string;
  yearMonth: string;
  onSaved?: () => void;
}

type SaveState = "idle" | "saving" | "saved";

export default function MonthlyDataForm({ storeId, yearMonth, onSaved }: MonthlyDataFormProps) {
  const [draft, setDraft] = useState<ReturnType<typeof withDefaults> | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    let cancelled = false;
    repo.getMonthlyData(storeId, yearMonth).then((existing) => {
      if (!cancelled) setDraft(withDefaults(storeId, yearMonth, existing));
    });
    return () => {
      cancelled = true;
    };
  }, [storeId, yearMonth]);

  if (!draft) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  const patch = <K extends keyof MonthlyMetrics>(key: K, value: MonthlyMetrics[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async () => {
    setSaveState("saving");
    const { storeId: _storeId, yearMonth: _yearMonth, updatedAt: _updatedAt, ...rest } = draft;
    await repo.upsertMonthlyData(storeId, yearMonth, rest);
    setSaveState("saved");
    onSaved?.();
    setTimeout(() => setSaveState("idle"), 2000);
  };

  return (
    <div className="space-y-6 pb-24">
      <RevenueForm value={draft.revenue} onChange={(v) => patch("revenue", v)} />
      <AcquisitionForm value={draft.acquisition} onChange={(v) => patch("acquisition", v)} />
      <RepeatForm value={draft.repeat} onChange={(v) => patch("repeat", v)} />
      <GoogleBusinessForm value={draft.googleBusiness} onChange={(v) => patch("googleBusiness", v)} />
      <WebsiteForm value={draft.website} onChange={(v) => patch("website", v)} />
      <SnsForm value={draft.sns} onChange={(v) => patch("sns", v)} />
      <RecruitingForm value={draft.recruiting} onChange={(v) => patch("recruiting", v)} />
      <RetentionForm value={draft.retention} onChange={(v) => patch("retention", v)} />
      <ProductivityForm value={draft.productivity} onChange={(v) => patch("productivity", v)} />
      <BrandForm value={draft.brand} onChange={(v) => patch("brand", v)} />
      <ManagementForm value={draft.management} onChange={(v) => patch("management", v)} />

      <div className="fixed bottom-0 left-0 right-0 md:left-64 z-40 bg-white/90 backdrop-blur border-t border-gray-100 px-5 md:px-10 py-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-70"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          {saveState === "saving" && <Loader2 size={15} className="animate-spin" />}
          {saveState === "saved" && <Check size={15} />}
          {saveState === "saving" ? "保存中..." : saveState === "saved" ? "保存しました" : "この月のデータを保存する"}
        </button>
      </div>
    </div>
  );
}
