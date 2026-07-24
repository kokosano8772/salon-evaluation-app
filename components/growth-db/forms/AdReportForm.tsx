"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import * as repo from "@/lib/growth-db/ad-report-repository";
import { AD_PLATFORM_LABEL, AdCampaignMetrics, AdPlatform, AdReport } from "@/lib/growth-db/ad-report-types";
import FormSection from "./FormSection";
import TextField from "./TextField";
import NumberField from "./NumberField";
import PercentField from "./PercentField";

interface AdReportFormProps {
  storeId: string;
  yearMonth: string;
  platform: AdPlatform;
  onSaved?: () => void;
}

type SaveState = "idle" | "saving" | "saved";

function emptyDraft(): Omit<AdReport, "id" | "storeId" | "yearMonth" | "platform" | "createdAt" | "updatedAt" | "aiResult"> {
  return {
    accountId: "",
    spend: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    conversions: 0,
    cpa: 0,
    cvr: 0,
    reach: undefined,
    frequency: undefined,
    campaigns: [],
  };
}

function emptyCampaign(): AdCampaignMetrics {
  return {
    id: crypto.randomUUID(),
    name: "",
    spend: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    conversions: 0,
    cpa: 0,
    cvr: 0,
  };
}

export default function AdReportForm({ storeId, yearMonth, platform, onSaved }: AdReportFormProps) {
  const [draft, setDraft] = useState<ReturnType<typeof emptyDraft> | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    let cancelled = false;
    setDraft(null);
    repo.getAdReport(storeId, yearMonth, platform).then((existing) => {
      if (cancelled) return;
      if (existing) {
        const { accountId, spend, impressions, clicks, ctr, cpc, conversions, cpa, cvr, reach, frequency, campaigns } = existing;
        setDraft({ accountId, spend, impressions, clicks, ctr, cpc, conversions, cpa, cvr, reach, frequency, campaigns });
      } else {
        setDraft(emptyDraft());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [storeId, yearMonth, platform]);

  if (!draft) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  const patch = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));

  const patchCampaign = (id: string, key: keyof AdCampaignMetrics, value: string | number) => {
    setDraft((prev) =>
      prev
        ? { ...prev, campaigns: prev.campaigns.map((c) => (c.id === id ? { ...c, [key]: value } : c)) }
        : prev
    );
  };

  const addCampaign = () => patch("campaigns", [...draft.campaigns, emptyCampaign()]);
  const removeCampaign = (id: string) => patch("campaigns", draft.campaigns.filter((c) => c.id !== id));

  const handleSave = async () => {
    setSaveState("saving");
    await repo.upsertAdReport(storeId, yearMonth, platform, draft);
    setSaveState("saved");
    onSaved?.();
    setTimeout(() => setSaveState("idle"), 2000);
  };

  return (
    <div className="space-y-6 pb-24">
      <FormSection title={`${AD_PLATFORM_LABEL[platform]} - アカウント全体`} description="対象期間の合計値を入力してください">
        <TextField label="アカウントID" value={draft.accountId} onChange={(v) => patch("accountId", v)} placeholder="例: 123-456-7890" />
        <NumberField label="広告費" value={draft.spend} onChange={(v) => patch("spend", v)} suffix="円" />
        <NumberField label="インプレッション数" value={draft.impressions} onChange={(v) => patch("impressions", v)} />
        <NumberField label="クリック数" value={draft.clicks} onChange={(v) => patch("clicks", v)} />
        <PercentField label="CTR" value={draft.ctr} onChange={(v) => patch("ctr", v)} />
        <NumberField label="CPC" value={draft.cpc} onChange={(v) => patch("cpc", v)} suffix="円" />
        <NumberField label="コンバージョン数" value={draft.conversions} onChange={(v) => patch("conversions", v)} />
        <NumberField label="CPA" value={draft.cpa} onChange={(v) => patch("cpa", v)} suffix="円" />
        <PercentField label="コンバージョン率" value={draft.cvr} onChange={(v) => patch("cvr", v)} />
        {platform === "meta" && (
          <>
            <NumberField label="リーチ" value={draft.reach ?? 0} onChange={(v) => patch("reach", v)} />
            <NumberField label="フリークエンシー" value={draft.frequency ?? 0} onChange={(v) => patch("frequency", v)} step={0.1} />
          </>
        )}
      </FormSection>

      <div className="card-luxury p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-charcoal-900">キャンペーン別データ</p>
            <p className="text-xs text-gray-400 mt-0.5">キャンペーン単位の実績を入力してください</p>
          </div>
          <button
            onClick={addCampaign}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-charcoal-700 hover:bg-gray-50"
          >
            <Plus size={14} strokeWidth={2} />
            キャンペーンを追加
          </button>
        </div>

        {draft.campaigns.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">まだキャンペーンが登録されていません</p>
        ) : (
          <div className="space-y-4">
            {draft.campaigns.map((campaign, i) => (
              <div key={campaign.id} className="rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 tracking-wide">キャンペーン {i + 1}</p>
                  <button
                    onClick={() => removeCampaign(campaign.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                    title="削除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField label="キャンペーン名" value={campaign.name} onChange={(v) => patchCampaign(campaign.id, "name", v)} />
                  <NumberField label="広告費" value={campaign.spend} onChange={(v) => patchCampaign(campaign.id, "spend", v)} suffix="円" />
                  <NumberField label="インプレッション数" value={campaign.impressions} onChange={(v) => patchCampaign(campaign.id, "impressions", v)} />
                  <NumberField label="クリック数" value={campaign.clicks} onChange={(v) => patchCampaign(campaign.id, "clicks", v)} />
                  <PercentField label="CTR" value={campaign.ctr} onChange={(v) => patchCampaign(campaign.id, "ctr", v)} />
                  <NumberField label="CPC" value={campaign.cpc} onChange={(v) => patchCampaign(campaign.id, "cpc", v)} suffix="円" />
                  <NumberField label="コンバージョン数" value={campaign.conversions} onChange={(v) => patchCampaign(campaign.id, "conversions", v)} />
                  <NumberField label="CPA" value={campaign.cpa} onChange={(v) => patchCampaign(campaign.id, "cpa", v)} suffix="円" />
                  <PercentField label="コンバージョン率" value={campaign.cvr} onChange={(v) => patchCampaign(campaign.id, "cvr", v)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
