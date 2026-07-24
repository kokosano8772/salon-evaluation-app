// 広告レポートの非同期CRUD窓口。repository.ts / competitor-repository.ts と同じ方針
// （Supabaseへの薄いラッパー、コンポーネントは直接Supabaseをimportしない）で分離。

import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { AdCampaignMetrics, AdPlatform, AdReport, AgeGroupClicks, GenderBreakdown, HourlyClicks } from "./ad-report-types";

type AdReportRow = Database["public"]["Tables"]["ad_reports"]["Row"];

export function mapAdReportRow(row: AdReportRow): AdReport {
  return {
    id: row.id,
    storeId: row.store_id,
    yearMonth: row.year_month,
    platform: row.platform,
    accountId: row.account_id,
    spend: row.spend,
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: row.ctr,
    cpc: row.cpc,
    conversions: row.conversions,
    cpa: row.cpa,
    cvr: row.cvr,
    reach: row.reach ?? undefined,
    frequency: row.frequency ?? undefined,
    campaigns: (row.campaigns as AdCampaignMetrics[]) ?? [],
    genderBreakdown: (row.gender_breakdown as GenderBreakdown | null) ?? undefined,
    hourlyClicks: (row.hourly_clicks as HourlyClicks[] | null) ?? undefined,
    ageGroupClicks: (row.age_group_clicks as AgeGroupClicks[] | null) ?? undefined,
    targetAgeRange: row.target_age_range,
    aiResult: row.ai_result,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdReports(storeId: string, yearMonth?: string): Promise<AdReport[]> {
  const supabase = createClient();
  let query = supabase.from("ad_reports").select("*").eq("store_id", storeId);
  if (yearMonth) query = query.eq("year_month", yearMonth);
  query = query.order("year_month", { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapAdReportRow);
}

export async function getAdReport(
  storeId: string,
  yearMonth: string,
  platform: AdPlatform
): Promise<AdReport | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ad_reports")
    .select("*")
    .eq("store_id", storeId)
    .eq("year_month", yearMonth)
    .eq("platform", platform)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAdReportRow(data) : null;
}

export type AdReportPatch = Partial<
  Omit<AdReport, "id" | "storeId" | "yearMonth" | "platform" | "createdAt" | "updatedAt">
>;

export async function upsertAdReport(
  storeId: string,
  yearMonth: string,
  platform: AdPlatform,
  patch: AdReportPatch
): Promise<AdReport> {
  const supabase = createClient();

  const row: Database["public"]["Tables"]["ad_reports"]["Insert"] = {
    store_id: storeId,
    year_month: yearMonth,
    platform,
  };
  if (patch.accountId !== undefined) row.account_id = patch.accountId;
  if (patch.spend !== undefined) row.spend = patch.spend;
  if (patch.impressions !== undefined) row.impressions = patch.impressions;
  if (patch.clicks !== undefined) row.clicks = patch.clicks;
  if (patch.ctr !== undefined) row.ctr = patch.ctr;
  if (patch.cpc !== undefined) row.cpc = patch.cpc;
  if (patch.conversions !== undefined) row.conversions = patch.conversions;
  if (patch.cpa !== undefined) row.cpa = patch.cpa;
  if (patch.cvr !== undefined) row.cvr = patch.cvr;
  if (patch.reach !== undefined) row.reach = patch.reach ?? null;
  if (patch.frequency !== undefined) row.frequency = patch.frequency ?? null;
  if (patch.campaigns !== undefined) row.campaigns = patch.campaigns;
  if (patch.genderBreakdown !== undefined) row.gender_breakdown = patch.genderBreakdown;
  if (patch.hourlyClicks !== undefined) row.hourly_clicks = patch.hourlyClicks;
  if (patch.ageGroupClicks !== undefined) row.age_group_clicks = patch.ageGroupClicks;
  if (patch.targetAgeRange !== undefined) row.target_age_range = patch.targetAgeRange;
  if (patch.aiResult !== undefined) row.ai_result = patch.aiResult;

  const { data, error } = await supabase
    .from("ad_reports")
    .upsert(row, { onConflict: "store_id,year_month,platform" })
    .select()
    .single();
  if (error) throw error;
  return mapAdReportRow(data);
}

export async function deleteAdReport(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("ad_reports").delete().eq("id", id);
  if (error) throw error;
}
