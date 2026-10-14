import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: webAsset, error: assetError } = await admin.from("ranking_web_assets").select("*").eq("id", id).maybeSingle();
  if (assetError || !webAsset) {
    return NextResponse.json({ error: "対象サイトが見つかりませんでした" }, { status: 404 });
  }
  const { data: salon } = await admin.from("ranking_salons").select("*").eq("id", webAsset.salon_id).maybeSingle();

  const { data: runs, error: runsError } = await admin
    .from("ranking_audit_runs")
    .select("*")
    .eq("web_asset_id", id)
    .order("created_at", { ascending: false });
  if (runsError) {
    return NextResponse.json({ error: runsError.message }, { status: 500 });
  }

  const latestRun = runs?.[0] ?? null;
  let items: Record<string, unknown>[] = [];
  if (latestRun) {
    const { data: scores } = await admin.from("ranking_audit_scores").select("*").eq("audit_run_id", latestRun.id);

    const criteriaItemIds = (scores ?? []).map((s) => s.criteria_item_id);
    const { data: criteriaItems } = await admin
      .from("ranking_criteria_items")
      .select("*")
      .in("id", criteriaItemIds.length > 0 ? criteriaItemIds : [""]);
    const criteriaItemById = new Map((criteriaItems ?? []).map((c) => [c.id, c]));

    const scoreIds = (scores ?? []).map((s) => s.id);
    const { data: evidence } = await admin
      .from("ranking_audit_evidence")
      .select("*")
      .in("audit_score_id", scoreIds.length > 0 ? scoreIds : [""]);
    const evidenceByScoreId = new Map((evidence ?? []).map((e) => [e.audit_score_id, e]));

    items = (scores ?? [])
      .map((s) => {
        const criteriaItem = criteriaItemById.get(s.criteria_item_id);
        return {
          itemKey: criteriaItem?.item_key ?? "",
          category: criteriaItem?.category ?? "",
          label: criteriaItem?.label ?? "",
          sortOrder: criteriaItem?.sort_order ?? 0,
          score: s.score,
          maxScore: s.max_score,
          status: s.status,
          evidence: evidenceByScoreId.get(s.id) ?? null,
        };
      })
      .sort((a, b) => (a.sortOrder as number) - (b.sortOrder as number));
  }

  return NextResponse.json({ webAsset, salon, runs: runs ?? [], latestRun, items });
}
