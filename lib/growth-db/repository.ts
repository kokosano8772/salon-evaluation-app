// 成長データベースの非同期CRUD窓口。
//
// 実装はSupabase（Postgres, RLSでauthenticatedロールのみ読み書き可）への薄いラッパー。
// すべての関数は async のまま — このシグネチャは変更しない設計にしてあるため、
// ローカルダミーデータ時代から呼び出し側（コンポーネント）は無修正で動く。
// コンポーネントは必ずこのファイル経由でデータを読み書きし、Supabaseクライアントを
// 直接importしないこと。

import { createClient } from "@/lib/supabase/client";
import { calculateGrowthScore } from "./scoring";
import { GrowthScore, LinkedDiagnosisResult, MonthlyMetrics, Store } from "./types";
import { Database } from "@/lib/supabase/database.types";
import { averageGrowthScores, findPeerGroup, findRegionalGroup } from "./comparison";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type MonthlyMetricsRow = Database["public"]["Tables"]["monthly_metrics"]["Row"];
type DiagnosisResultRow = Database["public"]["Tables"]["diagnosis_results"]["Row"];

export function mapStoreRow(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    area: row.area,
    openedYear: row.opened_year,
    storeCount: row.store_count,
    seatCount: row.seat_count,
    businessHours: row.business_hours,
    businessDays: row.business_days,
    staffCount: row.staff_count,
    targetCustomer: row.target_customer,
    averageUnitPrice: row.average_unit_price,
    tradeArea: row.trade_area,
    storeFormat: row.store_format,
    businessCategory: row.business_category,
    homepageUrl: row.homepage_url,
    hotpepperUrl: row.hotpepper_url,
    recruitmentLpUrl: row.recruitment_lp_url,
    googleAdsActive: row.google_ads_active,
    metaAdsActive: row.meta_ads_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function storeToRow(store: Partial<Store>): Partial<StoreRow> {
  const row: Partial<StoreRow> = {};
  if (store.name !== undefined) row.name = store.name;
  if (store.phone !== undefined) row.phone = store.phone;
  if (store.area !== undefined) row.area = store.area;
  if (store.openedYear !== undefined) row.opened_year = store.openedYear;
  if (store.storeCount !== undefined) row.store_count = store.storeCount;
  if (store.seatCount !== undefined) row.seat_count = store.seatCount;
  if (store.businessHours !== undefined) row.business_hours = store.businessHours;
  if (store.businessDays !== undefined) row.business_days = store.businessDays;
  if (store.staffCount !== undefined) row.staff_count = store.staffCount;
  if (store.targetCustomer !== undefined) row.target_customer = store.targetCustomer;
  if (store.averageUnitPrice !== undefined) row.average_unit_price = store.averageUnitPrice;
  if (store.tradeArea !== undefined) row.trade_area = store.tradeArea;
  if (store.storeFormat !== undefined) row.store_format = store.storeFormat;
  if (store.businessCategory !== undefined) row.business_category = store.businessCategory;
  if (store.homepageUrl !== undefined) row.homepage_url = store.homepageUrl;
  if (store.hotpepperUrl !== undefined) row.hotpepper_url = store.hotpepperUrl;
  if (store.recruitmentLpUrl !== undefined) row.recruitment_lp_url = store.recruitmentLpUrl;
  if (store.googleAdsActive !== undefined) row.google_ads_active = store.googleAdsActive;
  if (store.metaAdsActive !== undefined) row.meta_ads_active = store.metaAdsActive;
  return row;
}

export function mapMonthlyMetricsRow(row: MonthlyMetricsRow): MonthlyMetrics {
  return {
    storeId: row.store_id,
    yearMonth: row.year_month,
    revenue: (row.revenue ?? undefined) as MonthlyMetrics["revenue"],
    acquisition: (row.acquisition ?? undefined) as MonthlyMetrics["acquisition"],
    repeat: (row.repeat_metrics ?? undefined) as MonthlyMetrics["repeat"],
    googleBusiness: (row.google_business ?? undefined) as MonthlyMetrics["googleBusiness"],
    website: (row.website ?? undefined) as MonthlyMetrics["website"],
    sns: (row.sns ?? undefined) as MonthlyMetrics["sns"],
    recruiting: (row.recruiting ?? undefined) as MonthlyMetrics["recruiting"],
    retention: (row.retention ?? undefined) as MonthlyMetrics["retention"],
    productivity: (row.productivity ?? undefined) as MonthlyMetrics["productivity"],
    brand: (row.brand ?? undefined) as MonthlyMetrics["brand"],
    management: (row.management ?? undefined) as MonthlyMetrics["management"],
    basicSnapshot: (row.basic_snapshot ?? undefined) as MonthlyMetrics["basicSnapshot"],
    updatedAt: row.updated_at,
  };
}

function mapDiagnosisResultRow(row: DiagnosisResultRow): LinkedDiagnosisResult {
  return {
    id: row.id,
    storeId: row.store_id,
    salonName: row.salon_name,
    salonPhone: row.salon_phone,
    totalScore: row.total_score,
    rank: row.rank,
    categoryScores: row.category_scores as LinkedDiagnosisResult["categoryScores"],
    completedAt: row.completed_at,
    status: row.status,
    createdAt: row.created_at,
  };
}

export interface GetStoresParams {
  search?: string;
  area?: string;
  googleAdsOnly?: boolean;
  metaAdsOnly?: boolean;
  sortBy?: "name" | "area" | "score" | "updatedAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface GetStoresResult {
  items: Store[];
  total: number;
}

const SORT_COLUMN: Record<NonNullable<GetStoresParams["sortBy"]>, string> = {
  name: "name",
  area: "area",
  score: "latest_score",
  updatedAt: "updated_at",
};

export async function getStores(params: GetStoresParams = {}): Promise<GetStoresResult> {
  const { search, area, googleAdsOnly, metaAdsOnly, sortBy = "updatedAt", sortDir = "desc", page = 1, pageSize = 12 } = params;
  const supabase = createClient();

  let query = supabase.from("stores").select("*", { count: "exact" });

  if (search && search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }
  if (area) {
    query = query.eq("area", area);
  }
  if (googleAdsOnly) {
    query = query.eq("google_ads_active", true);
  }
  if (metaAdsOnly) {
    query = query.eq("meta_ads_active", true);
  }

  const start = (page - 1) * pageSize;
  query = query
    .order(SORT_COLUMN[sortBy], { ascending: sortDir === "asc", nullsFirst: false })
    .range(start, start + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { items: (data ?? []).map(mapStoreRow), total: count ?? 0 };
}

export async function getStore(storeId: string): Promise<Store | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("stores").select("*").eq("id", storeId).maybeSingle();
  if (error) throw error;
  return data ? mapStoreRow(data) : null;
}

export async function createStore(input: Omit<Store, "id" | "createdAt" | "updatedAt">): Promise<Store> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stores")
    .insert(storeToRow(input) as Database["public"]["Tables"]["stores"]["Insert"])
    .select()
    .single();
  if (error) throw error;
  return mapStoreRow(data);
}

export async function updateStore(storeId: string, patch: Partial<Store>): Promise<Store> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stores")
    .update({ ...storeToRow(patch), updated_at: new Date().toISOString() })
    .eq("id", storeId)
    .select()
    .single();
  if (error) throw error;
  return mapStoreRow(data);
}

export async function deleteStore(storeId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("stores").delete().eq("id", storeId);
  if (error) throw error;
}

export async function getMonthlyData(storeId: string, yearMonth: string): Promise<MonthlyMetrics | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("monthly_metrics")
    .select("*")
    .eq("store_id", storeId)
    .eq("year_month", yearMonth)
    .maybeSingle();
  if (error) throw error;
  return data ? mapMonthlyMetricsRow(data) : null;
}

export interface MonthlyRange {
  from?: string;
  to?: string;
}

export async function listMonthlyData(storeId: string, range?: MonthlyRange): Promise<MonthlyMetrics[]> {
  const supabase = createClient();
  let query = supabase.from("monthly_metrics").select("*").eq("store_id", storeId);
  if (range?.from) query = query.gte("year_month", range.from);
  if (range?.to) query = query.lte("year_month", range.to);
  query = query.order("year_month", { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapMonthlyMetricsRow);
}

export async function upsertMonthlyData(
  storeId: string,
  yearMonth: string,
  patch: Partial<Omit<MonthlyMetrics, "storeId" | "yearMonth">>
): Promise<MonthlyMetrics> {
  const supabase = createClient();

  const row: Database["public"]["Tables"]["monthly_metrics"]["Insert"] = {
    store_id: storeId,
    year_month: yearMonth,
  };
  if (patch.revenue !== undefined) row.revenue = patch.revenue;
  if (patch.acquisition !== undefined) row.acquisition = patch.acquisition;
  if (patch.repeat !== undefined) row.repeat_metrics = patch.repeat;
  if (patch.googleBusiness !== undefined) row.google_business = patch.googleBusiness;
  if (patch.website !== undefined) row.website = patch.website;
  if (patch.sns !== undefined) row.sns = patch.sns;
  if (patch.recruiting !== undefined) row.recruiting = patch.recruiting;
  if (patch.retention !== undefined) row.retention = patch.retention;
  if (patch.productivity !== undefined) row.productivity = patch.productivity;
  if (patch.brand !== undefined) row.brand = patch.brand;
  if (patch.management !== undefined) row.management = patch.management;
  if (patch.basicSnapshot !== undefined) row.basic_snapshot = patch.basicSnapshot;

  const { data, error } = await supabase
    .from("monthly_metrics")
    .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: "store_id,year_month" })
    .select()
    .single();
  if (error) throw error;

  await refreshLatestScore(storeId);

  return mapMonthlyMetricsRow(data);
}

// stores.latest_score / latest_score_year_month は一覧の並び替えを高速化するための
// 非正規化カラム。スコアリングの複雑なロジック(scoring.ts)をDB側に複製しないため、
// 月次データ更新の都度アプリ側で計算し直して書き込む。
async function refreshLatestScore(storeId: string): Promise<void> {
  const store = await getStore(storeId);
  if (!store) return;
  const history = await listMonthlyData(storeId);
  if (history.length === 0) return;

  const latestYearMonth = history[history.length - 1].yearMonth;
  const score = calculateGrowthScore(storeId, latestYearMonth, history, store.staffCount);

  const supabase = createClient();
  await supabase
    .from("stores")
    .update({ latest_score: score.totalScore, latest_score_year_month: latestYearMonth })
    .eq("id", storeId);
}

export async function getGrowthScore(storeId: string, yearMonth: string): Promise<GrowthScore | null> {
  const store = await getStore(storeId);
  if (!store) return null;
  const history = await listMonthlyData(storeId);
  if (history.length === 0) return null;
  return calculateGrowthScore(storeId, yearMonth, history, store.staffCount);
}

export async function getLatestGrowthScore(storeId: string): Promise<GrowthScore | null> {
  const history = await listMonthlyData(storeId);
  if (history.length === 0) return null;
  return getGrowthScore(storeId, history[history.length - 1].yearMonth);
}

export interface ComparisonResult {
  own: GrowthScore | null;
  peerGroup: { stores: Store[]; averageScore: GrowthScore | null };
  regionalGroup: { stores: Store[]; level: "municipality" | "prefecture"; label: string; averageScore: GrowthScore | null };
}

// 同規模店舗・地域平均との比較データ。独自診断スコア(GrowthScore)を都度計算して平均するだけの
// 参照専用データで、DBには保存しない。
export async function getComparisonData(storeId: string): Promise<ComparisonResult | null> {
  const target = await getStore(storeId);
  if (!target) return null;

  const supabase = createClient();
  const { data: allRows, error } = await supabase.from("stores").select("*");
  if (error) throw error;
  const allStores = (allRows ?? []).map(mapStoreRow);

  const own = await getLatestGrowthScore(storeId);

  const peerStores = findPeerGroup(target, allStores);
  const peerScores = (await Promise.all(peerStores.map((s) => getLatestGrowthScore(s.id)))).filter(
    (s): s is GrowthScore => s !== null
  );

  const regional = findRegionalGroup(target, allStores);
  const regionalScores = (await Promise.all(regional.stores.map((s) => getLatestGrowthScore(s.id)))).filter(
    (s): s is GrowthScore => s !== null
  );

  return {
    own,
    peerGroup: { stores: peerStores, averageScore: averageGrowthScores(peerScores) },
    regionalGroup: {
      stores: regional.stores,
      level: regional.level,
      label: regional.label,
      averageScore: averageGrowthScores(regionalScores),
    },
  };
}

// 詳細診断(/diagnosis)から連携された結果一覧。独自診断スコアの計算には使わない参照専用データ。
export async function getDiagnosisResultsForStore(storeId: string): Promise<LinkedDiagnosisResult[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("diagnosis_results")
    .select("*")
    .eq("store_id", storeId)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapDiagnosisResultRow);
}

export async function markDiagnosisResultReviewed(diagnosisResultId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("diagnosis_results")
    .update({ status: "reviewed" })
    .eq("id", diagnosisResultId);
  if (error) throw error;
}
