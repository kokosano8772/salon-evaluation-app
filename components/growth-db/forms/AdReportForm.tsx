"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import * as repo from "@/lib/growth-db/ad-report-repository";
import { getAdSyncDefault, saveAdSyncDefault } from "@/lib/growth-db/ad-sync-defaults";
import {
  AD_PLATFORM_LABEL,
  AGE_GROUPS,
  AdCampaignMetrics,
  AdPlatform,
  AdReport,
  AdReportCategory,
  AgeGroupClicks,
  AgeGroupConversions,
  ConversionActionBreakdown,
  GenderBreakdown,
  GenderBreakdownValue,
  HOURLY_SLOTS,
  HourlyClicks,
  SearchTermClicks,
} from "@/lib/growth-db/ad-report-types";
import FormSection from "./FormSection";
import TextField from "./TextField";
import NumberField from "./NumberField";
import PercentField from "./PercentField";

interface AdReportFormProps {
  storeId: string;
  storeName: string;
  yearMonth: string;
  platform: AdPlatform;
  category?: AdReportCategory;
  onSaved?: () => void;
}

type SaveState = "idle" | "saving" | "saved";

type AdReportDraft = Omit<
  AdReport,
  | "id"
  | "storeId"
  | "yearMonth"
  | "platform"
  | "category"
  | "createdAt"
  | "updatedAt"
  | "aiResult"
  | "genderBreakdown"
  | "hourlyClicks"
  | "ageGroupClicks"
  | "ageGroupConversions"
  | "conversionActionBreakdown"
  | "searchTerms"
> & {
  genderBreakdown: GenderBreakdown;
  hourlyClicks: HourlyClicks[];
  ageGroupClicks: AgeGroupClicks[];
  ageGroupConversions: AgeGroupConversions[];
  conversionActionBreakdown: ConversionActionBreakdown[];
  searchTerms: SearchTermClicks[];
};

const GENDER_LABEL: Record<keyof GenderBreakdownValue, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

function emptyGenderValue(): GenderBreakdownValue {
  return { male: 0, female: 0, other: 0 };
}

function emptyGenderBreakdown(): GenderBreakdown {
  return {
    impressions: emptyGenderValue(),
    reach: emptyGenderValue(),
    clicks: emptyGenderValue(),
    ctr: emptyGenderValue(),
  };
}

function emptyHourlyClicks(): HourlyClicks[] {
  return HOURLY_SLOTS.map((hour) => ({ hour, clicks: 0, stopped: false }));
}

function emptyAgeGroupClicks(): AgeGroupClicks[] {
  return AGE_GROUPS.map((ageGroup) => ({ ageGroup, clicks: 0 }));
}

function emptyAgeGroupConversions(): AgeGroupConversions[] {
  return AGE_GROUPS.map((ageGroup) => ({ ageGroup, conversions: 0 }));
}

function emptyConversionAction(): ConversionActionBreakdown {
  return { name: "", conversions: 0 };
}

function emptySearchTerm(): SearchTermClicks {
  return { term: "", clicks: 0 };
}

function emptyDraft(): AdReportDraft {
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
    genderBreakdown: emptyGenderBreakdown(),
    hourlyClicks: emptyHourlyClicks(),
    ageGroupClicks: emptyAgeGroupClicks(),
    ageGroupConversions: emptyAgeGroupConversions(),
    conversionActionBreakdown: [],
    searchTerms: [],
    targetAgeRange: "",
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

type SyncState = "idle" | "syncing" | "synced" | "error";

export default function AdReportForm({
  storeId,
  storeName,
  yearMonth,
  platform,
  category = "acquisition",
  onSaved,
}: AdReportFormProps) {
  const [draft, setDraft] = useState<AdReportDraft | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncError, setSyncError] = useState("");
  const [syncedCampaignCount, setSyncedCampaignCount] = useState(0);
  const [saveDefaultError, setSaveDefaultError] = useState("");
  // アカウントID・絞り込みキーワードは店舗×プラットフォーム×区分ごとにstoresへ
  // 保存済みのものを自動で読み込む（下のuseEffect）。一度同期に成功した値を
  // 覚えておき、どの月でも自動で入るようにするため、ここでは空で初期化するだけ。
  const [campaignNameFilter, setCampaignNameFilter] = useState(storeName);
  // 集客のキャンペーン名が求人キャンペーン名の部分文字列になっている店舗
  // （例: 集客「AmeLab」／求人「AmeLab（求人）」）向けの除外キーワード（Google広告のみ）。
  const [campaignNameExclude, setCampaignNameExclude] = useState("");

  useEffect(() => {
    let cancelled = false;

    // アカウントID・キーワードの読み込みはgetAdReportとは切り離した独立処理にする。
    // Promise.allで束ねていると、こちらが失敗（マイグレーション未実行等）した際に
    // getAdReport側の結果まで握りつぶされ、フォーム全体が読み込み中のまま止まる
    // 不具合があったため分離した。
    getAdSyncDefault(storeId, platform, category)
      .then((syncDefault) => {
        if (cancelled) return;
        setCampaignNameFilter(syncDefault?.campaignNameFilter || storeName);
        setCampaignNameExclude(syncDefault?.campaignNameExclude ?? "");
        // getAdReport側が先に終わっていて、その月にアカウントIDが未保存だった場合は
        // ここで店舗の保存済みデフォルトを補う（どちらが先に終わっても対応できるように）。
        if (syncDefault?.accountId) {
          setDraft((prev) => (prev && !prev.accountId ? { ...prev, accountId: syncDefault.accountId } : prev));
        }
      })
      .catch((err) => {
        console.error("同期条件の読み込みに失敗しました", err);
        if (!cancelled) setCampaignNameFilter(storeName);
      });

    setDraft(null);
    repo.getAdReport(storeId, yearMonth, platform, category).then((existing) => {
      if (cancelled) return;
      if (existing) {
        const {
          accountId,
          spend,
          impressions,
          clicks,
          ctr,
          cpc,
          conversions,
          cpa,
          cvr,
          reach,
          frequency,
          campaigns,
          genderBreakdown,
          hourlyClicks,
          ageGroupClicks,
          ageGroupConversions,
          conversionActionBreakdown,
          searchTerms,
          targetAgeRange,
        } = existing;
        setDraft({
          accountId: accountId || "",
          spend,
          impressions,
          clicks,
          ctr,
          cpc,
          conversions,
          cpa,
          cvr,
          reach,
          frequency,
          campaigns,
          genderBreakdown: genderBreakdown ?? emptyGenderBreakdown(),
          hourlyClicks: hourlyClicks && hourlyClicks.length === HOURLY_SLOTS.length ? hourlyClicks : emptyHourlyClicks(),
          ageGroupClicks: ageGroupClicks && ageGroupClicks.length === AGE_GROUPS.length ? ageGroupClicks : emptyAgeGroupClicks(),
          ageGroupConversions:
            ageGroupConversions && ageGroupConversions.length === AGE_GROUPS.length
              ? ageGroupConversions
              : emptyAgeGroupConversions(),
          conversionActionBreakdown: conversionActionBreakdown ?? [],
          searchTerms: searchTerms ?? [],
          targetAgeRange: targetAgeRange ?? "",
        });
      } else {
        setDraft(emptyDraft());
      }
    });
    return () => {
      cancelled = true;
    };
  }, [storeId, yearMonth, platform, category]);

  if (!draft) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  const patch = <K extends keyof AdReportDraft>(key: K, value: AdReportDraft[K]) =>
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

  const patchGender = (
    metric: keyof GenderBreakdown,
    gender: keyof GenderBreakdownValue,
    value: number
  ) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            genderBreakdown: {
              ...prev.genderBreakdown,
              [metric]: { ...prev.genderBreakdown[metric], [gender]: value },
            },
          }
        : prev
    );
  };

  const patchHourly = (index: number, key: keyof HourlyClicks, value: number | boolean) => {
    setDraft((prev) =>
      prev
        ? { ...prev, hourlyClicks: prev.hourlyClicks.map((h, i) => (i === index ? { ...h, [key]: value } : h)) }
        : prev
    );
  };

  const patchAgeGroup = (index: number, value: number) => {
    setDraft((prev) =>
      prev
        ? { ...prev, ageGroupClicks: prev.ageGroupClicks.map((a, i) => (i === index ? { ...a, clicks: value } : a)) }
        : prev
    );
  };

  const patchAgeGroupConversion = (index: number, value: number) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            ageGroupConversions: prev.ageGroupConversions.map((a, i) => (i === index ? { ...a, conversions: value } : a)),
          }
        : prev
    );
  };

  const patchConversionAction = (index: number, key: keyof ConversionActionBreakdown, value: string | number) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            conversionActionBreakdown: prev.conversionActionBreakdown.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
          }
        : prev
    );
  };
  const addConversionAction = () => patch("conversionActionBreakdown", [...draft.conversionActionBreakdown, emptyConversionAction()]);
  const removeConversionAction = (index: number) =>
    patch("conversionActionBreakdown", draft.conversionActionBreakdown.filter((_, i) => i !== index));

  const patchSearchTerm = (index: number, key: keyof SearchTermClicks, value: string | number) => {
    setDraft((prev) =>
      prev
        ? { ...prev, searchTerms: prev.searchTerms.map((s, i) => (i === index ? { ...s, [key]: value } : s)) }
        : prev
    );
  };
  const addSearchTerm = () => patch("searchTerms", [...draft.searchTerms, emptySearchTerm()]);
  const removeSearchTerm = (index: number) => patch("searchTerms", draft.searchTerms.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaveState("saving");
    await repo.upsertAdReport(storeId, yearMonth, platform, draft, category);
    setSaveState("saved");
    onSaved?.();
    setTimeout(() => setSaveState("idle"), 2000);
  };

  const handleSync = async () => {
    if (!draft.accountId) {
      setSyncState("error");
      setSyncError("先にアカウントIDを入力してください");
      return;
    }
    setSyncState("syncing");
    setSyncError("");
    try {
      const res = await fetch("/api/growth-db/ad-report-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          accountId: draft.accountId,
          yearMonth,
          campaignNameFilter: campaignNameFilter.trim() || undefined,
          campaignNameExclude: platform === "google" ? campaignNameExclude.trim() || undefined : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

      const data = json.data as Partial<AdReportDraft>;
      setDraft((prev) => (prev ? { ...prev, ...data } : prev));
      setSyncedCampaignCount(data.campaigns?.length ?? 0);

      // 同期に成功したアカウントID・キーワードの組み合わせを店舗ごとに保存し、
      // 次回以降どの月でも自動で読み込まれるようにする。ここが失敗しても
      // （マイグレーション未実行等）、データ自体の取得は成功しているので
      // 同期全体をエラー扱いにはしない。
      setSaveDefaultError("");
      try {
        await saveAdSyncDefault(storeId, platform, category, {
          accountId: draft.accountId,
          campaignNameFilter: campaignNameFilter.trim(),
          campaignNameExclude: platform === "google" ? campaignNameExclude.trim() : undefined,
        });
      } catch (saveErr) {
        const msg = saveErr instanceof Error ? saveErr.message : "不明なエラー";
        console.error("同期条件の保存に失敗しました", saveErr);
        setSaveDefaultError(msg);
      }

      setSyncState("synced");
      setTimeout(() => setSyncState("idle"), 4000);
    } catch (err) {
      setSyncState("error");
      setSyncError(err instanceof Error ? err.message : "不明なエラー");
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {(platform === "meta" || platform === "google") && (
        <div className="card-luxury p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-sm font-semibold text-charcoal-900">
                {platform === "meta" ? "Meta Marketing API" : "Google Ads API"}から自動取得
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {platform === "google"
                  ? `アカウントIDを入力してから実行してください（現在「${category === "recruitment" ? "求人" : "集客"}」区分で同期します。上のタブで切り替えできます）`
                  : "アカウントIDを入力してから実行してください（コンバージョン数は自動取得されないため引き続き手入力してください）"}
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncState === "syncing"}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
            >
              {syncState === "syncing" ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} strokeWidth={2} />}
              {syncState === "syncing" ? "取得中..." : "APIから同期"}
            </button>
          </div>
          <TextField
            label="キャンペーン名の絞り込みキーワード"
            value={campaignNameFilter}
            onChange={setCampaignNameFilter}
            placeholder={platform === "google" ? "例: 店舗名（集客/求人を区別できる場合はそのキーワードも含める）" : "例: 店舗名"}
          />
          <p className="text-xs text-gray-400 mt-1.5 mb-3">
            1つの広告アカウントに複数店舗のキャンペーンが混在している場合、このキーワードを含むキャンペーンだけを対象にします。空欄にするとアカウント内の全キャンペーンが対象になるため注意してください。
            同期に成功したアカウントID・キーワードはこの店舗・区分用に自動で保存され、次回以降の同期でも自動で読み込まれます。
          </p>
          {platform === "google" && (
            <>
              <TextField
                label="除外キーワード（任意）"
                value={campaignNameExclude}
                onChange={setCampaignNameExclude}
                placeholder="例: 求人（集客のキャンペーン名が求人キャンペーン名の一部になっている場合に指定）"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                「集客」の店舗名が「求人」のキャンペーン名にそのまま含まれている（例: 集客「AmeLab」／求人「AmeLab（求人）」）場合、
                絞り込みキーワードだけだと集客の同期に求人分まで混ざってしまいます。その場合はここに「求人」等、
                求人キャンペーン名にだけ含まれる文字列を入力すると、そのキャンペーンを除外できます。
              </p>
            </>
          )}
          {syncState === "error" && <p className="text-xs text-red-500 mt-3 whitespace-pre-wrap">{syncError}</p>}
          {syncState === "synced" && (
            <p className="text-xs text-[#6BAB8A] mt-3">
              取得しました（キャンペーン{syncedCampaignCount}件）。内容を確認して下の「この月のデータを保存する」で確定してください。
            </p>
          )}
        </div>
      )}

      <FormSection title={`${AD_PLATFORM_LABEL[platform]} - アカウント全体`} description="対象期間の合計値を入力してください">
        <TextField label="アカウントID" value={draft.accountId} onChange={(v) => patch("accountId", v)} placeholder="例: 123-456-7890" />
        {platform === "meta" && (
          <TextField label="ターゲット年齢層" value={draft.targetAgeRange} onChange={(v) => patch("targetAgeRange", v)} placeholder="例: 20-39歳" />
        )}
        {platform === "meta" && <NumberField label="広告費" value={draft.spend} onChange={(v) => patch("spend", v)} suffix="円" />}
        <NumberField label="インプレッション数" value={draft.impressions} onChange={(v) => patch("impressions", v)} />
        <NumberField label="クリック数" value={draft.clicks} onChange={(v) => patch("clicks", v)} />
        <PercentField label="CTR" value={draft.ctr} onChange={(v) => patch("ctr", v)} />
        {platform === "meta" && <NumberField label="CPC" value={draft.cpc} onChange={(v) => patch("cpc", v)} suffix="円" />}
        <NumberField label="コンバージョン数" value={draft.conversions} onChange={(v) => patch("conversions", v)} />
        {platform === "meta" && <NumberField label="CPA" value={draft.cpa} onChange={(v) => patch("cpa", v)} suffix="円" />}
        <PercentField label="コンバージョン率" value={draft.cvr} onChange={(v) => patch("cvr", v)} />
        {platform === "meta" && (
          <>
            <NumberField label="リーチ" value={draft.reach ?? 0} onChange={(v) => patch("reach", v)} />
            <NumberField label="フリークエンシー" value={draft.frequency ?? 0} onChange={(v) => patch("frequency", v)} step={0.1} />
          </>
        )}
      </FormSection>

      {/* キャンペーン別データ・性別内訳・時間帯別クリックはMeta広告レポートでのみ表示に使う項目のため、
          Google広告では入力フォームからも省く（Googleのレポートは代わりにコンバージョンアクション別内訳・
          年代別・検索語句をAPI同期で取得して表示している）。 */}
      {platform === "meta" && (
        <>
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

          <div className="card-luxury p-6">
            <p className="text-sm font-semibold text-charcoal-900 mb-1">性別別の内訳</p>
            <p className="text-xs text-gray-400 mb-4">男性・女性・その他ごとの実績を入力してください</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {(Object.keys(GENDER_LABEL) as (keyof GenderBreakdownValue)[]).map((gender) => (
                <div key={gender}>
                  <p className="text-xs font-semibold text-gray-400 tracking-wide mb-3">{GENDER_LABEL[gender]}</p>
                  <div className="space-y-4">
                    <NumberField
                      label="インプレッション数"
                      value={draft.genderBreakdown.impressions[gender]}
                      onChange={(v) => patchGender("impressions", gender, v)}
                    />
                    <NumberField
                      label="リーチ"
                      value={draft.genderBreakdown.reach[gender]}
                      onChange={(v) => patchGender("reach", gender, v)}
                    />
                    <NumberField
                      label="クリック数"
                      value={draft.genderBreakdown.clicks[gender]}
                      onChange={(v) => patchGender("clicks", gender, v)}
                    />
                    <PercentField
                      label="CTR"
                      value={draft.genderBreakdown.ctr[gender]}
                      onChange={(v) => patchGender("ctr", gender, v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-luxury p-6">
            <p className="text-sm font-semibold text-charcoal-900 mb-1">時間帯別クリック数</p>
            <p className="text-xs text-gray-400 mb-4">0時〜24時の時間帯ごとのクリック数と配信停止の有無を入力してください</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {draft.hourlyClicks.map((slot, i) => (
                <div key={slot.hour} className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs font-semibold text-gray-400 mb-2">{slot.hour}時</p>
                  <NumberField label="クリック数" value={slot.clicks} onChange={(v) => patchHourly(i, "clicks", v)} />
                  <label className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={slot.stopped ?? false}
                      onChange={(e) => patchHourly(i, "stopped", e.target.checked)}
                    />
                    配信停止
                  </label>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="card-luxury p-6">
        <p className="text-sm font-semibold text-charcoal-900 mb-1">年齢層別クリック数</p>
        <p className="text-xs text-gray-400 mb-4">年齢層ごとのクリック数を入力してください</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {draft.ageGroupClicks.map((entry, i) => (
            <NumberField
              key={entry.ageGroup}
              label={`${entry.ageGroup}歳`}
              value={entry.clicks}
              onChange={(v) => patchAgeGroup(i, v)}
            />
          ))}
        </div>
      </div>

      {/* 以下3項目はGoogle広告レポート（年代別コンバージョン率グラフ・内訳・検索語句）で使う項目。
          通常はAPI同期で自動取得されるが、同期できない月やAPI未設定の店舗でも手入力できるようにする。 */}
      {platform === "google" && (
        <>
          <div className="card-luxury p-6">
            <p className="text-sm font-semibold text-charcoal-900 mb-1">年齢層別コンバージョン数</p>
            <p className="text-xs text-gray-400 mb-4">
              年齢層ごとの{category === "recruitment" ? "お問い合わせ" : "予約"}ボタンクリック数を入力してください
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {draft.ageGroupConversions.map((entry, i) => (
                <NumberField
                  key={entry.ageGroup}
                  label={`${entry.ageGroup}歳`}
                  value={entry.conversions}
                  onChange={(v) => patchAgeGroupConversion(i, v)}
                />
              ))}
            </div>
          </div>

          <div className="card-luxury p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-charcoal-900">コンバージョンアクション別内訳</p>
                <p className="text-xs text-gray-400 mt-0.5">「電話」「LINE」等、コンバージョンアクションごとの件数を入力してください</p>
              </div>
              <button
                onClick={addConversionAction}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-charcoal-700 hover:bg-gray-50"
              >
                <Plus size={14} strokeWidth={2} />
                項目を追加
              </button>
            </div>
            {draft.conversionActionBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">まだ項目が登録されていません</p>
            ) : (
              <div className="space-y-3">
                {draft.conversionActionBreakdown.map((entry, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <TextField
                        label="アクション名"
                        value={entry.name}
                        onChange={(v) => patchConversionAction(i, "name", v)}
                        placeholder="例: 電話"
                      />
                    </div>
                    <div className="w-32">
                      <NumberField label="件数" value={entry.conversions} onChange={(v) => patchConversionAction(i, "conversions", v)} />
                    </div>
                    <button
                      onClick={() => removeConversionAction(i)}
                      className="w-9 h-9 mt-6 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 shrink-0"
                      title="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {category === "acquisition" && (
            <div className="card-luxury p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-charcoal-900">クリックが多かった検索語句</p>
                  <p className="text-xs text-gray-400 mt-0.5">クリック数が多い順に入力してください（サロン名は含めない）</p>
                </div>
                <button
                  onClick={addSearchTerm}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-charcoal-700 hover:bg-gray-50"
                >
                  <Plus size={14} strokeWidth={2} />
                  語句を追加
                </button>
              </div>
              {draft.searchTerms.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">まだ語句が登録されていません</p>
              ) : (
                <div className="space-y-3">
                  {draft.searchTerms.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1">
                        <TextField
                          label="検索語句"
                          value={entry.term}
                          onChange={(v) => patchSearchTerm(i, "term", v)}
                          placeholder="例: カットが上手い美容室"
                        />
                      </div>
                      <div className="w-32">
                        <NumberField label="クリック数" value={entry.clicks} onChange={(v) => patchSearchTerm(i, "clicks", v)} />
                      </div>
                      <button
                        onClick={() => removeSearchTerm(i)}
                        className="w-9 h-9 mt-6 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 shrink-0"
                        title="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

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
