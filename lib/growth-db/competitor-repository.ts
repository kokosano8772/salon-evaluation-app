// 競合調査セッションの非同期CRUD窓口。repository.ts と同じ方針
// （Supabaseへの薄いラッパー、コンポーネントは直接Supabaseをimportしない）で分離。

import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { AnalysisMode, ComparisonData, SalonData } from "@/lib/competitor-research/types";

type CompetitorSessionRow = Database["public"]["Tables"]["competitor_research_sessions"]["Row"];

export interface CompetitorSession {
  id: string;
  storeId: string;
  region: string;
  mode: AnalysisMode;
  competitorCount: number;
  salons: SalonData[];
  cellData: ComparisonData;
  aiResult: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitorSessionSummary {
  id: string;
  storeId: string;
  region: string;
  mode: AnalysisMode;
  competitorCount: number;
  createdAt: string;
  updatedAt: string;
}

export function mapCompetitorSessionRow(row: CompetitorSessionRow): CompetitorSession {
  return {
    id: row.id,
    storeId: row.store_id,
    region: row.region,
    mode: row.mode,
    competitorCount: row.competitor_count,
    salons: (row.salons as SalonData[]) ?? [],
    cellData: (row.cell_data as ComparisonData) ?? {},
    aiResult: row.ai_result,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCompetitorSessionSummaryRow(row: CompetitorSessionRow): CompetitorSessionSummary {
  return {
    id: row.id,
    storeId: row.store_id,
    region: row.region,
    mode: row.mode,
    competitorCount: row.competitor_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listCompetitorSessions(storeId: string): Promise<CompetitorSessionSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("competitor_research_sessions")
    .select("id, store_id, region, mode, competitor_count, created_at, updated_at")
    .eq("store_id", storeId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapCompetitorSessionSummaryRow(row as CompetitorSessionRow));
}

export async function getCompetitorSession(sessionId: string): Promise<CompetitorSession | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("competitor_research_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapCompetitorSessionRow(data) : null;
}

export async function createCompetitorSession(
  storeId: string,
  input: { region: string; mode: AnalysisMode; salons: SalonData[]; cellData: ComparisonData; aiResult?: string | null }
): Promise<CompetitorSession> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("competitor_research_sessions")
    .insert({
      store_id: storeId,
      region: input.region,
      mode: input.mode,
      competitor_count: input.salons.filter((s) => !s.isOwn).length,
      salons: input.salons,
      cell_data: input.cellData,
      ai_result: input.aiResult ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCompetitorSessionRow(data);
}

export async function updateCompetitorSession(
  sessionId: string,
  patch: { region?: string; mode?: AnalysisMode; salons?: SalonData[]; cellData?: ComparisonData; aiResult?: string | null }
): Promise<CompetitorSession> {
  const supabase = createClient();
  const row: Database["public"]["Tables"]["competitor_research_sessions"]["Update"] = {};
  if (patch.region !== undefined) row.region = patch.region;
  if (patch.mode !== undefined) row.mode = patch.mode;
  if (patch.salons !== undefined) {
    row.salons = patch.salons;
    row.competitor_count = patch.salons.filter((s) => !s.isOwn).length;
  }
  if (patch.cellData !== undefined) row.cell_data = patch.cellData;
  if (patch.aiResult !== undefined) row.ai_result = patch.aiResult;

  const { data, error } = await supabase
    .from("competitor_research_sessions")
    .update(row)
    .eq("id", sessionId)
    .select()
    .single();
  if (error) throw error;
  return mapCompetitorSessionRow(data);
}

export async function deleteCompetitorSession(sessionId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("competitor_research_sessions").delete().eq("id", sessionId);
  if (error) throw error;
}
