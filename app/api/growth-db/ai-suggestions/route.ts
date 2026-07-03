import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateGrowthScore } from "@/lib/growth-db/scoring";
import { generateGrowthSuggestions } from "@/lib/ai/generateGrowthSuggestions";
import { mapMonthlyMetricsRow, mapStoreRow } from "@/lib/growth-db/repository";

// /dashboard配下と同じくSupabase Authでログインしたスタッフのみ呼び出せる
// （RLSに加えて、ここでも明示的にセッションを確認する）。
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { storeId?: unknown; yearMonth?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  if (typeof body.storeId !== "string" || typeof body.yearMonth !== "string") {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const { storeId, yearMonth } = body;

  const { data: storeRow, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle();
  if (storeError || !storeRow) {
    return NextResponse.json({ error: "store not found" }, { status: 404 });
  }
  const store = mapStoreRow(storeRow);

  const { data: metricsRows, error: metricsError } = await supabase
    .from("monthly_metrics")
    .select("*")
    .eq("store_id", storeId)
    .order("year_month", { ascending: true });
  if (metricsError) {
    return NextResponse.json({ error: "failed to load monthly data" }, { status: 500 });
  }
  const history = (metricsRows ?? []).map(mapMonthlyMetricsRow);
  const monthly = history.find((m) => m.yearMonth === yearMonth);
  if (!monthly) {
    return NextResponse.json({ error: "no data for this month" }, { status: 404 });
  }

  const score = calculateGrowthScore(storeId, yearMonth, history, store.staffCount);

  try {
    const suggestions = await generateGrowthSuggestions(store, monthly, score);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI suggestion generation failed:", error);
    return NextResponse.json({ error: "AI提案の生成に失敗しました" }, { status: 502 });
  }
}
