// Google Ads API（REST）との実連携。
// Graph API同様、公式クライアントライブラリは使わずRESTを直接呼び出す（依存追加を避けるため）。
//
// 【集客/求人について】
// 1つの広告アカウントに複数店舗、かつ目的（集客/求人）の異なるキャンペーンが混在しており、
// キャンペーン名の命名規則が統一されていないため自動判別ができない。そのため
// campaignNameFilterは「同期を実行する人が、対象月・対象目的に該当するキャンペーンだけに
// 絞り込めるキーワードをその都度入力する」運用にしている（呼び出し側のUIで集客/求人を選択）。
//
// 【リフレッシュトークンについて】
// OAuth同意画面が「テスト」ステータスのため、GOOGLE_ADS_REFRESH_TOKENは7日で失効する。
// 失効した場合はOAuth Playground等で再取得し、環境変数を更新する必要がある。
//
// 【コンバージョン数について】
// MetaのAPIと違い、Google Ads APIのmetrics.conversionsは事前にアカウント側で設定した
// コンバージョンアクションの合計値がそのまま返るため、Metaのように「action_typeの解釈が
// 店舗ごとに異なる」問題が無い。そのためconversions/cpa/cvrもここで取得する。
//
// 参考:
// https://developers.google.com/google-ads/api/rest/auth
// https://developers.google.com/google-ads/api/rest/common/search
// https://developers.google.com/google-ads/api/docs/query/overview

import {
  AdCampaignMetrics,
  AgeGroup,
  AGE_GROUPS,
  AgeGroupClicks,
  AgeGroupConversions,
  ConversionActionBreakdown,
  SearchTermClicks,
} from "@/lib/growth-db/ad-report-types";
import { AdPlatformClient, NormalizedAdReport } from "./types";

const GOOGLE_ADS_API_VERSION = "v25";
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;
const OAUTH_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} が設定されていません`);
  return value;
}

// 顧客IDはハイフン無し（10桁の数字）でAPIに渡す必要がある
function normalizeCustomerId(id: string): string {
  return id.replace(/-/g, "");
}

// "YYYY-MM" -> その月の初日・末日（YYYY-MM-DD）
function monthRange(yearMonth: string): { since: string; until: string } {
  const [year, month] = yearMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { since: `${yearMonth}-01`, until: `${yearMonth}-${String(lastDay).padStart(2, "0")}` };
}

// GAQLのLIKE句で特殊な意味を持つ文字（[ ] % _）をエスケープする
function escapeGaqlLike(value: string): string {
  return value.replace(/[[\]%_]/g, (c) => `[${c}]`);
}

// アクセストークンはリクエストのたびに取り直さず、有効期限内は使い回す
// （同じサーバープロセス内で複数月まとめて同期する一括同期機能で無駄なリクエストを減らすため）。
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.token;
  }
  const res = await fetch(OAUTH_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getEnv("GOOGLE_ADS_CLIENT_ID"),
      client_secret: getEnv("GOOGLE_ADS_CLIENT_SECRET"),
      refresh_token: getEnv("GOOGLE_ADS_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      "Googleアカウントの認証に失敗しました（リフレッシュトークンが失効している可能性があります。" +
        `OAuth Playground等で再取得してGOOGLE_ADS_REFRESH_TOKENを更新してください）: ${json.error_description ?? json.error ?? `HTTP ${res.status}`}`
    );
  }
  cachedAccessToken = { token: json.access_token, expiresAt: Date.now() + (json.expires_in - 60) * 1000 };
  return cachedAccessToken.token;
}

interface GoogleAdsErrorResponse {
  error?: { message: string; status: string };
}

async function searchGoogleAds<T>(customerId: string, query: string): Promise<T[]> {
  const accessToken = await getAccessToken();
  const results: T[] = [];
  let pageToken: string | undefined;

  do {
    const res = await fetch(`${GOOGLE_ADS_API_BASE}/customers/${normalizeCustomerId(customerId)}/googleAds:search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "developer-token": getEnv("GOOGLE_ADS_DEVELOPER_TOKEN"),
        "login-customer-id": normalizeCustomerId(getEnv("GOOGLE_ADS_LOGIN_CUSTOMER_ID")),
      },
      body: JSON.stringify(pageToken ? { query, pageToken } : { query }),
    });
    const json = (await res.json()) as GoogleAdsErrorResponse & { results?: T[]; nextPageToken?: string };
    if (!res.ok || json.error) {
      throw new Error(`Google Ads APIの呼び出しに失敗しました: ${json.error?.message ?? `HTTP ${res.status}`}`);
    }
    results.push(...(json.results ?? []));
    pageToken = json.nextPageToken;
  } while (pageToken);

  return results;
}

interface CampaignExistenceRow {
  campaign?: { id?: string; name?: string };
}

interface CampaignMetricsRow {
  campaign?: { id?: string; name?: string };
  metrics?: {
    impressions?: string;
    clicks?: string;
    ctr?: number; // 割合（0.05 = 5%）
    averageCpc?: string; // マイクロ単位
    costMicros?: string;
    conversions?: number;
    costPerConversion?: number; // マイクロ単位
    conversionsFromInteractionsRate?: number; // 割合
  };
}

// コンバージョンアクション名ごとの内訳。店舗ごとに設定してるアクション名・項目数が
// 違うため、固定のフィールドにせずsegments.conversion_action_nameでそのまま取得する。
interface ConversionActionRow {
  segments?: { conversionActionName?: string };
  metrics?: { conversions?: number };
}

// 年代別の指標は campaign リソースのセグメントとしては取れず、専用の
// age_range_view リソースから取得する必要がある。
interface AgeRangeRow {
  adGroupCriterion?: { ageRange?: { type?: string } };
  metrics?: { clicks?: string; conversions?: number };
}

// 検索語句レポート。search_term_view リソースから取得する。
interface SearchTermRow {
  searchTermView?: { searchTerm?: string };
  metrics?: { clicks?: string };
}

// Metaの実際の年齢区分と同様、Googleの実際の年齢区分（AGE_RANGE_18_24〜）を
// うちのAGE_GROUPS（20-24始まり）に合わせて吸収する。
function mapGoogleAgeRange(raw: string | undefined): AgeGroup | null {
  switch (raw) {
    case "AGE_RANGE_18_24":
      return "20-24";
    case "AGE_RANGE_25_34":
      return "25-34";
    case "AGE_RANGE_35_44":
      return "35-44";
    case "AGE_RANGE_45_54":
      return "45-54";
    case "AGE_RANGE_55_64":
      return "55-64";
    case "AGE_RANGE_65_UP":
      return "65+";
    default:
      return null; // AGE_RANGE_UNDETERMINED 等
  }
}

const MICROS_PER_UNIT = 1_000_000;

function toPercent(fraction: number | undefined): number {
  return Math.round((fraction ?? 0) * 1000) / 10;
}

// コンバージョン率（予約/問い合わせボタンを押した割合）はレポート上で小数第2位まで
// 表示するため、CTRより1桁細かく丸める。
function toPercent2(fraction: number | undefined): number {
  return Math.round((fraction ?? 0) * 10000) / 100;
}

function toYen(micros: string | number | undefined): number {
  return Number(micros ?? 0) / MICROS_PER_UNIT;
}

export class GoogleAdsClient implements AdPlatformClient {
  async fetchMonthlyReport(
    accountId: string,
    yearMonth: string,
    campaignNameFilter?: string,
    campaignNameExclude?: string
  ): Promise<NormalizedAdReport> {
    const { since, until } = monthRange(yearMonth);

    // 集客のキャンペーン名が求人キャンペーン名の部分文字列になっている店舗
    // （例: 集客「AmeLab」／求人「AmeLab（求人）」）だと、絞り込みキーワードだけでは
    // 集客の同期に求人分まで混ざってしまう。campaignNameExcludeが指定されていれば
    // それを含むキャンペーンをGAQLレベルで除外する。
    const nameClauseParts: string[] = [];
    if (campaignNameFilter) nameClauseParts.push(`campaign.name LIKE '%${escapeGaqlLike(campaignNameFilter)}%'`);
    if (campaignNameExclude) nameClauseParts.push(`NOT campaign.name LIKE '%${escapeGaqlLike(campaignNameExclude)}%'`);
    const nameClause = nameClauseParts.join(" AND ");

    // キャンペーンの「存在確認」は日付条件の無いクエリで行う。日付・指標付きのクエリだと
    // その期間に実績（配信）が無いキャンペーンが結果に含まれず、「存在しない」と誤判定
    // されてしまうため（Meta連携で同種の不具合が起きたのと同じ理由）。
    const nameCondition = nameClause ? ` WHERE ${nameClause}` : "";
    const existingCampaigns = await searchGoogleAds<CampaignExistenceRow>(
      accountId,
      `SELECT campaign.id, campaign.name FROM campaign${nameCondition}`
    );

    if (campaignNameFilter && existingCampaigns.length === 0) {
      const allCampaigns = await searchGoogleAds<CampaignExistenceRow>(accountId, "SELECT campaign.id, campaign.name FROM campaign");
      const names = allCampaigns.map((c) => c.campaign?.name).filter(Boolean).join("、");
      throw new Error(
        `キーワード「${campaignNameFilter}」に一致するキャンペーンが見つかりませんでした。` +
          (names ? `このアカウントのキャンペーン名: ${names}` : "このアカウントにはキャンペーンがありません。")
      );
    }

    const metricsRows = await searchGoogleAds<CampaignMetricsRow>(
      accountId,
      "SELECT campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.ctr, " +
        "metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.cost_per_conversion, " +
        `metrics.conversions_from_interactions_rate FROM campaign WHERE segments.date BETWEEN '${since}' AND '${until}'` +
        (nameClause ? ` AND ${nameClause}` : "")
    );
    const metricsByCampaignId = new Map(metricsRows.map((row) => [row.campaign?.id, row.metrics]));

    // コンバージョンアクション名ごとの内訳。campaign.idごとには分けず、対象期間・
    // 対象キャンペーン全体でアクション名ごとに合算する（店舗単位の内訳として使うため）。
    const conversionActionRows = await searchGoogleAds<ConversionActionRow>(
      accountId,
      "SELECT segments.conversion_action_name, metrics.conversions FROM campaign " +
        `WHERE segments.date BETWEEN '${since}' AND '${until}'` +
        (nameClause ? ` AND ${nameClause}` : "")
    );
    const conversionActionTotals = new Map<string, number>();
    for (const row of conversionActionRows) {
      const name = row.segments?.conversionActionName;
      if (!name) continue;
      conversionActionTotals.set(name, (conversionActionTotals.get(name) ?? 0) + (row.metrics?.conversions ?? 0));
    }
    const conversionActionBreakdown: ConversionActionBreakdown[] = Array.from(conversionActionTotals, ([name, conversions]) => ({
      name,
      conversions,
    }));

    // 年代別の指標はcampaignリソースのセグメントとしては取得できないため、
    // 専用のage_range_viewリソースから、対象キャンペーンIDで絞り込んで取得する。
    const campaignIds = existingCampaigns.map((c) => c.campaign?.id).filter((id): id is string => !!id);
    const ageRangeRows =
      campaignIds.length > 0
        ? await searchGoogleAds<AgeRangeRow>(
            accountId,
            "SELECT ad_group_criterion.age_range.type, metrics.clicks, metrics.conversions FROM age_range_view " +
              `WHERE segments.date BETWEEN '${since}' AND '${until}' ` +
              `AND campaign.id IN (${campaignIds.join(",")})`
          )
        : [];
    const ageClicksTotals = new Map<AgeGroup, number>(AGE_GROUPS.map((g) => [g, 0]));
    const ageConversionsTotals = new Map<AgeGroup, number>(AGE_GROUPS.map((g) => [g, 0]));
    for (const row of ageRangeRows) {
      const ageGroup = mapGoogleAgeRange(row.adGroupCriterion?.ageRange?.type);
      if (!ageGroup) continue;
      ageClicksTotals.set(ageGroup, (ageClicksTotals.get(ageGroup) ?? 0) + Number(row.metrics?.clicks ?? 0));
      ageConversionsTotals.set(ageGroup, (ageConversionsTotals.get(ageGroup) ?? 0) + (row.metrics?.conversions ?? 0));
    }
    const ageGroupClicks: AgeGroupClicks[] = AGE_GROUPS.map((ageGroup) => ({ ageGroup, clicks: ageClicksTotals.get(ageGroup) ?? 0 }));
    const ageGroupConversions: AgeGroupConversions[] = AGE_GROUPS.map((ageGroup) => ({
      ageGroup,
      conversions: ageConversionsTotals.get(ageGroup) ?? 0,
    }));

    // クリックが多かった検索語句。店舗名（絞り込みキーワード）を含む語句は
    // 「サロン名で検索しただけ」であり実績として意味が薄いため除外する。
    const searchTermRows =
      campaignIds.length > 0
        ? await searchGoogleAds<SearchTermRow>(
            accountId,
            "SELECT search_term_view.search_term, metrics.clicks FROM search_term_view " +
              `WHERE segments.date BETWEEN '${since}' AND '${until}' ` +
              `AND campaign.id IN (${campaignIds.join(",")})`
          )
        : [];
    const searchTermTotals = new Map<string, number>();
    const excludeKeyword = campaignNameFilter?.toLowerCase();
    for (const row of searchTermRows) {
      const term = row.searchTermView?.searchTerm;
      if (!term) continue;
      if (excludeKeyword && term.toLowerCase().includes(excludeKeyword)) continue;
      searchTermTotals.set(term, (searchTermTotals.get(term) ?? 0) + Number(row.metrics?.clicks ?? 0));
    }
    const searchTerms: SearchTermClicks[] = Array.from(searchTermTotals, ([term, clicks]) => ({ term, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const campaigns: AdCampaignMetrics[] = existingCampaigns.map((c) => {
      const m = metricsByCampaignId.get(c.campaign?.id);
      const impressions = Number(m?.impressions ?? 0);
      const clicks = Number(m?.clicks ?? 0);
      const spend = toYen(m?.costMicros);
      const conversions = m?.conversions ?? 0;
      return {
        id: c.campaign?.id ?? "",
        name: c.campaign?.name ?? "",
        spend,
        impressions,
        clicks,
        ctr: toPercent(m?.ctr),
        cpc: toYen(m?.averageCpc),
        conversions,
        cpa: toYen(m?.costPerConversion),
        cvr: toPercent2(m?.conversionsFromInteractionsRate),
      };
    });

    // アカウント全体の指標は、内訳（キャンペーン別）の単純平均ではなく、
    // 生の合計値から算出し直す（率の平均は誤った数値になるため）。
    const totals = campaigns.reduce(
      (acc, c) => ({
        spend: acc.spend + c.spend,
        impressions: acc.impressions + c.impressions,
        clicks: acc.clicks + c.clicks,
        conversions: acc.conversions + c.conversions,
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    );

    return {
      spend: totals.spend,
      impressions: totals.impressions,
      clicks: totals.clicks,
      ctr: totals.impressions > 0 ? Math.round((totals.clicks / totals.impressions) * 1000) / 10 : 0,
      cpc: totals.clicks > 0 ? Math.round((totals.spend / totals.clicks) * 10) / 10 : 0,
      conversions: totals.conversions,
      cpa: totals.conversions > 0 ? Math.round((totals.spend / totals.conversions) * 10) / 10 : 0,
      cvr: totals.clicks > 0 ? Math.round((totals.conversions / totals.clicks) * 10000) / 100 : 0,
      campaigns,
      conversionActionBreakdown,
      ageGroupClicks,
      ageGroupConversions,
      searchTerms,
    };
  }
}
