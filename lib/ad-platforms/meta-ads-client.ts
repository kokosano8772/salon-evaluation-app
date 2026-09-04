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
import { AdPlatformClient, CampaignNotStartedError, NormalizedAdReport } from "./types";

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

// "act_"接頭辞が無いと広告アカウントではなく別のオブジェクト（Facebookページ等）への
// 問い合わせと解釈され、「Page Access Tokenが必要」等の誤ったエラーになるため補完する。
function normalizeAccountId(accountId: string): string {
  return accountId.startsWith("act_") ? accountId : `act_${accountId}`;
}

async function callGraphApi<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const url = new URL(`${GRAPH_API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", getAccessToken());

  const res = await fetch(url.toString());
  const json = (await res.json()) as GraphApiErrorResponse & { data?: T[] };
  if (!res.ok || json.error) {
    throw new Error(`Meta Marketing APIの呼び出しに失敗しました: ${json.error?.message ?? `HTTP ${res.status}`}`);
  }
  return json.data ?? [];
}

async function callInsights<T>(accountId: string, params: Record<string, string>): Promise<T[]> {
  return callGraphApi<T>(`${normalizeAccountId(accountId)}/insights`, params);
}

// キャンペーンの「存在確認」はinsightsではなくcampaigns一覧エンドポイントで行う。
// insightsはその期間に実績（配信）が無いキャンペーンを行ごと返さないため、配信し始めた
// ばかりで実績がまだ付いていないキャンペーンが「存在しない」と誤判定されてしまうため。
interface CampaignListRow {
  id?: string;
  name?: string;
}

async function listCampaigns(accountId: string): Promise<CampaignListRow[]> {
  return callGraphApi<CampaignListRow>(`${normalizeAccountId(accountId)}/campaigns`, {
    fields: "id,name",
    limit: "500",
  });
}

// ターゲット年齢層・配信スケジュール（配信停止の時間帯）は広告セットの設定値。
// これは「今その時点で設定されている値」であり、月ごとの履歴ではない点に注意
// （ファイル内コメント参照）。
interface AdSetScheduleEntry {
  start_minute: number;
  end_minute: number;
  days: number[];
  timezone_type?: string;
}

interface AdSetRow {
  id?: string;
  targeting?: { age_min?: number; age_max?: number };
  adset_schedule?: AdSetScheduleEntry[];
}

async function listAdSets(accountId: string, campaignIds: string[]): Promise<AdSetRow[]> {
  if (campaignIds.length === 0) return [];
  return callGraphApi<AdSetRow>(`${normalizeAccountId(accountId)}/adsets`, {
    fields: "id,targeting{age_min,age_max},adset_schedule",
    filtering: JSON.stringify([{ field: "campaign.id", operator: "IN", value: campaignIds }]),
    limit: "500",
  });
}

// 複数の広告セットの年齢ターゲティングをまとめて、最小〜最大のレンジ文字列にする
function buildTargetAgeRange(adSets: AdSetRow[]): string | undefined {
  const ages = adSets
    .map((a) => a.targeting)
    .filter((t): t is { age_min?: number; age_max?: number } => !!t);
  const mins = ages.map((t) => t.age_min).filter((n): n is number => typeof n === "number");
  const maxs = ages.map((t) => t.age_max).filter((n): n is number => typeof n === "number");
  if (mins.length === 0 || maxs.length === 0) return undefined;
  return `${Math.min(...mins)}-${Math.max(...maxs)}歳`;
}

// 複数の広告セットの配信スケジュールを曜日を区別せず統合し、「配信している時間帯」の
// 集合を作る。どの広告セットにもスケジュール設定が無ければ「常時配信＝停止なし」とみなす。
function buildDeliveringHours(adSets: AdSetRow[]): Set<number> | null {
  const schedules = adSets.flatMap((a) => a.adset_schedule ?? []);
  if (schedules.length === 0) return null;

  const hours = new Set<number>();
  for (const entry of schedules) {
    const startHour = Math.floor(entry.start_minute / 60);
    const endHour = Math.ceil(entry.end_minute / 60);
    for (let h = startHour; h < endHour && h < 24; h++) hours.add(h);
  }
  return hours;
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
  async fetchMonthlyReport(accountId: string, yearMonth: string, campaignNameFilter?: string): Promise<NormalizedAdReport> {
    const { since, until } = monthRange(yearMonth);
    const timeRange = JSON.stringify({ since, until });

    // 1つの広告アカウントに複数店舗のキャンペーンが混在しているケースがあるため、
    // まずキャンペーン一覧（実績とは無関係に存在する全キャンペーン）を取得し、
    // 店舗名でのフィルタがあれば対象キャンペーンIDを絞り込む。
    const allCampaigns = await listCampaigns(accountId);

    const matchedCampaigns = campaignNameFilter
      ? allCampaigns.filter((c) => c.name?.includes(campaignNameFilter))
      : allCampaigns;

    // フィルタを指定したのに該当キャンペーンが1件も無い場合、アカウント全体（＝他店舗分を
    // 含む可能性がある）のデータを誤って返さないよう、エラーとして知らせる
    // （黙って0件のデータを返すと「同期したのに何も変わらない」ように見えてしまうため）。
    if (campaignNameFilter && matchedCampaigns.length === 0) {
      const names = allCampaigns.map((c) => c.name).filter(Boolean).join("、");
      throw new Error(
        `キーワード「${campaignNameFilter}」に一致するキャンペーンが見つかりませんでした。` +
          (names ? `このアカウントのキャンペーン名: ${names}` : "このアカウントにはキャンペーンがありません。")
      );
    }

    // 一括同期（複数月まとめて）で、対象キャンペーンがまだ開始していない月まで範囲に
    // 含めてしまうと、実績が無いだけなのに「表示回数0・クリック数0…」という本物のゼロ値
    // レコードが保存されてしまう（Google Ads連携で起きたのと同種の不具合）。
    // Metaのキャンペーンは「[店舗名]-YYYYMM」のように月ごとに命名されている運用が
    // 前提のため、この命名規則に沿っていることが確認できる場合（＝いずれかの
    // マッチしたキャンペーン名に6桁の数字が含まれる）だけ、対象月の数字を含む
    // キャンペーンが1件も無ければスキップする。命名規則に沿っていない店舗では
    // 判定できないため、従来通りスキップせず進める。
    const yearMonthDigits = yearMonth.replace("-", "");
    const followsMonthlyNaming = matchedCampaigns.some((c) => /\d{6}/.test(c.name ?? ""));
    if (campaignNameFilter && followsMonthlyNaming && !matchedCampaigns.some((c) => c.name?.includes(yearMonthDigits))) {
      throw new CampaignNotStartedError(`対象月（${yearMonth}）に一致するキャンペーンが見つからないため、データがありません`);
    }

    const campaignIds = matchedCampaigns.map((c) => c.id).filter((id): id is string => !!id);
    const filterParams: Record<string, string> = campaignNameFilter
      ? { filtering: JSON.stringify([{ field: "campaign.id", operator: "IN", value: campaignIds }]) }
      : {};

    // ターゲット年齢層・配信スケジュールは広告セットの「今の設定値」であり、insightsと違って
    // time_rangeで期間を絞れない。そのため店舗名だけでフィルタしたmatchedCampaigns
    // （命名規則「[店舗名]-YYYYMM」により対象月以外の過去キャンペーンも含まれ得る）を
    // そのまま使うと、他の月のキャンペーンの設定まで混ざって範囲が不正確に広がってしまう。
    // 対象月（YYYYMM）も名前に含むキャンペーンだけに絞り込んでから広告セットを取得する。
    // 該当が無い場合（命名規則に合わない等）は誤った値を出すより取得自体を諦める。
    const monthScopedCampaignIds = matchedCampaigns
      .filter((c) => c.name?.includes(yearMonthDigits))
      .map((c) => c.id)
      .filter((id): id is string => !!id);

    // age×genderは併用できるが、hourlyはage/genderと併用不可のため別呼び出しにする。
    const [totalsRows, ageGenderRows, hourlyRows, campaignMetricsRows, adSets] = await Promise.all([
      callInsights<AccountTotalsRow>(accountId, {
        fields: "spend,impressions,clicks,ctr,cpc,reach,frequency",
        time_range: timeRange,
        ...filterParams,
      }),
      callInsights<AgeGenderRow>(accountId, {
        fields: "impressions,reach,clicks",
        breakdowns: "age,gender",
        time_range: timeRange,
        limit: "200",
        ...filterParams,
      }),
      callInsights<HourlyRow>(accountId, {
        fields: "clicks",
        breakdowns: "hourly_stats_aggregated_by_advertiser_time_zone",
        time_range: timeRange,
        limit: "48",
        ...filterParams,
      }),
      callInsights<CampaignRow>(accountId, {
        fields: "campaign_id,spend,impressions,clicks,ctr,cpc",
        level: "campaign",
        time_range: timeRange,
        limit: "500",
        ...filterParams,
      }),
      listAdSets(accountId, monthScopedCampaignIds),
    ]);
    const metricsByCampaignId = new Map(campaignMetricsRows.map((row) => [row.campaign_id, row]));
    const targetAgeRange = buildTargetAgeRange(adSets);
    const deliveringHours = buildDeliveringHours(adSets);

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
    const hourlyClicks: HourlyClicks[] = HOURLY_SLOTS.map((hour, i) => ({
      hour,
      clicks: hourlyMap.get(hour) ?? 0,
      // deliveringHoursがnull（配信スケジュール設定なし）の場合は常時配信＝停止なし
      stopped: deliveringHours ? !deliveringHours.has(i) : false,
    }));

    // コンバージョン関連は取得しない（ファイル冒頭のコメント参照）。既存の手入力値を保持するため、
    // 呼び出し側（sync.ts→upsertAdReport）にはconversions/cpa/cvrを含めず渡す。
    // キャンペーンの一覧はmatchedCampaigns（実績とは無関係に実在確認済み）を基準にし、
    // 数値はinsightsに行が無ければ0として扱う（配信したばかりで実績がまだ無い場合など）。
    const campaigns: AdCampaignMetrics[] = matchedCampaigns.map((c) => {
      const metrics = c.id ? metricsByCampaignId.get(c.id) : undefined;
      return {
        id: c.id ?? crypto.randomUUID(),
        name: c.name ?? "",
        spend: Number(metrics?.spend ?? 0),
        impressions: Number(metrics?.impressions ?? 0),
        clicks: Number(metrics?.clicks ?? 0),
        ctr: Number(metrics?.ctr ?? 0),
        cpc: Number(metrics?.cpc ?? 0),
        conversions: 0,
        cpa: 0,
        cvr: 0,
      };
    });

    return {
      spend: Number(totals?.spend ?? 0),
      impressions: Number(totals?.impressions ?? 0),
      clicks: Number(totals?.clicks ?? 0),
      ctr: Number(totals?.ctr ?? 0),
      cpc: Number(totals?.cpc ?? 0),
      reach: totals?.reach !== undefined ? Number(totals.reach) : undefined,
      frequency: totals?.frequency !== undefined ? Number(totals.frequency) : undefined,
      ...(targetAgeRange !== undefined ? { targetAgeRange } : {}),
      campaigns,
      genderBreakdown,
      hourlyClicks,
      ageGroupClicks,
    };
  }
}
