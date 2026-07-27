// Meta Marketing API（Instagram/Facebook広告）との実連携。
// Graph API を直接呼び出す（依存追加を避けるため公式SDKは使わない）。
//
// 【コンバージョン数について】
// Meta側の "actions" 配列は、店舗ごとに設定しているコンバージョンイベント
// （購入・問い合わせ・予約など）によってどのaction_typeが「コンバージョン」に
// 該当するかが変わり、こちらで一律に決め打ちすると誤った数値になりかねない。
// そのため conversions/cpa/cvr はAPI連携では取得・上書きせず、引き続き
// /ads の入力画面で手動入力してもらう方針にしている。
//
// 参考: https://developers.facebook.com/docs/marketing-api/insights/
//       https://developers.facebook.com/docs/marketing-api/insights/breakdowns/

import { AGE_GROUPS, AgeGroup, AdCampaignMetrics, GenderBreakdown, GenderBreakdownValue, HourlyClicks, HOURLY_SLOTS } from "@/lib/growth-db/ad-report-types";
import { AdPlatformClient, NormalizedAdReport } from "./types";

const GRAPH_API_VERSION = "v25.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function getAccessToken(): string {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN が設定されていません");
  return token;
}

// "YYYY-MM" -> その月の初日・末日（YYYY-MM-DD）
function monthRange(yearMonth: string): { since: string; until: string } {
  const [year, month] = yearMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { since: `${yearMonth}-01`, until: `${yearMonth}-${String(lastDay).padStart(2, "0")}` };
}

interface GraphApiErrorResponse {
  error?: { message: string; type: string; code: number };
}

async function callInsights<T>(accountId: string, params: Record<string, string>): Promise<T[]> {
  const url = new URL(`${GRAPH_API_BASE}/${accountId}/insights`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", getAccessToken());

  const res = await fetch(url.toString());
  const json = (await res.json()) as GraphApiErrorResponse & { data?: T[] };
  if (!res.ok || json.error) {
    throw new Error(`Meta Marketing APIの呼び出しに失敗しました: ${json.error?.message ?? `HTTP ${res.status}`}`);
  }
  return json.data ?? [];
}

function mapGender(raw: string | undefined): keyof GenderBreakdownValue {
  if (raw === "male") return "male";
  if (raw === "female") return "female";
  return "other";
}

// Metaの実際の年齢区分（13-17, 18-24, 25-34, ...）を、うちのAGE_GROUPS
// （20-24始まり）に合わせて吸収する。13-17と18-24は最小バケットの20-24にまとめる。
function mapAgeGroup(raw: string | undefined): AgeGroup | null {
  if (raw === "13-17" || raw === "18-24") return "20-24";
  if ((AGE_GROUPS as readonly string[]).includes(raw ?? "")) return raw as AgeGroup;
  return null;
}

// "00:00:00 - 00:59:59" -> "0-1"
function mapHourlySlot(raw: string | undefined): string | null {
  const match = raw?.match(/^(\d{2}):/);
  if (!match) return null;
  const hour = Number(match[1]);
  return `${hour}-${hour + 1}`;
}

interface AccountTotalsRow {
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  reach?: string;
  frequency?: string;
}

interface AgeGenderRow {
  age?: string;
  gender?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
}

interface HourlyRow {
  hourly_stats_aggregated_by_advertiser_time_zone?: string;
  clicks?: string;
}

interface CampaignRow {
  campaign_id?: string;
  campaign_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
}

export class MetaAdsClient implements AdPlatformClient {
  async fetchMonthlyReport(accountId: string, yearMonth: string): Promise<NormalizedAdReport> {
    const { since, until } = monthRange(yearMonth);
    const timeRange = JSON.stringify({ since, until });

    // age×genderは併用できるが、hourlyはage/genderと併用不可のため別呼び出しにする。
    const [totalsRows, ageGenderRows, hourlyRows, campaignRows] = await Promise.all([
      callInsights<AccountTotalsRow>(accountId, {
        fields: "spend,impressions,clicks,ctr,cpc,reach,frequency",
        time_range: timeRange,
      }),
      callInsights<AgeGenderRow>(accountId, {
        fields: "impressions,reach,clicks",
        breakdowns: "age,gender",
        time_range: timeRange,
        limit: "200",
      }),
      callInsights<HourlyRow>(accountId, {
        fields: "clicks",
        breakdowns: "hourly_stats_aggregated_by_advertiser_time_zone",
        time_range: timeRange,
        limit: "48",
      }),
      callInsights<CampaignRow>(accountId, {
        fields: "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc",
        level: "campaign",
        time_range: timeRange,
        limit: "500",
      }),
    ]);

    const totals = totalsRows[0];

    const genderBreakdown: GenderBreakdown = {
      impressions: { male: 0, female: 0, other: 0 },
      reach: { male: 0, female: 0, other: 0 },
      clicks: { male: 0, female: 0, other: 0 },
      ctr: { male: 0, female: 0, other: 0 },
    };
    const ageClicks = new Map<AgeGroup, number>(AGE_GROUPS.map((g) => [g, 0]));

    for (const row of ageGenderRows) {
      const gender = mapGender(row.gender);
      genderBreakdown.impressions[gender] += Number(row.impressions ?? 0);
      genderBreakdown.reach[gender] += Number(row.reach ?? 0);
      genderBreakdown.clicks[gender] += Number(row.clicks ?? 0);

      const ageGroup = mapAgeGroup(row.age);
      if (ageGroup) ageClicks.set(ageGroup, (ageClicks.get(ageGroup) ?? 0) + Number(row.clicks ?? 0));
    }
    // 内訳のCTRは単純合算・平均せず、性別ごとのクリック数÷インプレッション数で算出し直す
    (Object.keys(genderBreakdown.impressions) as (keyof GenderBreakdownValue)[]).forEach((gender) => {
      const impressions = genderBreakdown.impressions[gender];
      genderBreakdown.ctr[gender] = impressions > 0 ? Math.round((genderBreakdown.clicks[gender] / impressions) * 1000) / 10 : 0;
    });

    const ageGroupClicks = AGE_GROUPS.map((ageGroup) => ({ ageGroup, clicks: ageClicks.get(ageGroup) ?? 0 }));

    const hourlyMap = new Map<string, number>(HOURLY_SLOTS.map((slot) => [slot, 0]));
    for (const row of hourlyRows) {
      const slot = mapHourlySlot(row.hourly_stats_aggregated_by_advertiser_time_zone);
      if (slot) hourlyMap.set(slot, (hourlyMap.get(slot) ?? 0) + Number(row.clicks ?? 0));
    }
    const hourlyClicks: HourlyClicks[] = HOURLY_SLOTS.map((hour) => ({ hour, clicks: hourlyMap.get(hour) ?? 0 }));

    // コンバージョン関連は取得しない（ファイル冒頭のコメント参照）。既存の手入力値を保持するため、
    // 呼び出し側（sync.ts→upsertAdReport）にはconversions/cpa/cvrを含めず渡す。
    const campaigns: AdCampaignMetrics[] = campaignRows.map((row) => ({
      id: row.campaign_id ?? crypto.randomUUID(),
      name: row.campaign_name ?? "",
      spend: Number(row.spend ?? 0),
      impressions: Number(row.impressions ?? 0),
      clicks: Number(row.clicks ?? 0),
      ctr: Number(row.ctr ?? 0),
      cpc: Number(row.cpc ?? 0),
      conversions: 0,
      cpa: 0,
      cvr: 0,
    }));

    return {
      spend: Number(totals?.spend ?? 0),
      impressions: Number(totals?.impressions ?? 0),
      clicks: Number(totals?.clicks ?? 0),
      ctr: Number(totals?.ctr ?? 0),
      cpc: Number(totals?.cpc ?? 0),
      reach: totals?.reach !== undefined ? Number(totals.reach) : undefined,
      frequency: totals?.frequency !== undefined ? Number(totals.frequency) : undefined,
      campaigns,
      genderBreakdown,
      hourlyClicks,
      ageGroupClicks,
    };
  }
}
