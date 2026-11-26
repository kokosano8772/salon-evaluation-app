import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_COMPARISON_COMPETITORS, RANKING_STALE_DAYS } from "@/lib/web-ranking/config";

// 特定の店舗の自社サイト+手で選んだ競合サイトだけに絞った、その場限りの順位比較。
// 既存のrankings/route.tsのような「登録済み全サイトの中でのグローバルな順位」
// ではなく、今回の比較対象にしたアセットだけでランキングを組み直す。
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const ownWebAssetId = typeof body.ownWebAssetId === "string" ? body.ownWebAssetId : "";
  const competitorWebAssetIds = Array.isArray(body.competitorWebAssetIds)
    ? body.competitorWebAssetIds.filter((v): v is string => typeof v === "string")
    : [];
  if (!ownWebAssetId) {
    return NextResponse.json({ error: "ownWebAssetIdを指定してください" }, { status: 400 });
  }
  if (competitorWebAssetIds.length > MAX_COMPARISON_COMPETITORS) {
    return NextResponse.json(
      { error: `比較できる競合は最大${MAX_COMPARISON_COMPETITORS}件までです` },
      { status: 400 }
    );
  }

  const assetIds = [ownWebAssetId, ...competitorWebAssetIds];
  const admin = createAdminClient();

  const { data: webAssets, error: assetsError } = await admin.from("ranking_web_assets").select("*").in("id", assetIds);
  if (assetsError) {
    return NextResponse.json({ error: assetsError.message }, { status: 500 });
  }
  const foundIds = new Set((webAssets ?? []).map((a) => a.id));
  const missing = assetIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    return NextResponse.json({ error: `対象が見つかりませんでした: ${missing.join(", ")}` }, { status: 404 });
  }

  const salonIds = Array.from(new Set((webAssets ?? []).map((a) => a.salon_id)));
  const { data: salons, error: salonsError } = await admin.from("ranking_salons").select("*").in("id", salonIds);
  if (salonsError) {
    return NextResponse.json({ error: salonsError.message }, { status: 500 });
  }
  const salonById = new Map((salons ?? []).map((s) => [s.id, s]));

  const { data: runs, error: runsError } = await admin
    .from("ranking_audit_runs")
    .select("*")
    .in("web_asset_id", assetIds)
    .order("created_at", { ascending: false });
  if (runsError) {
    return NextResponse.json({ error: runsError.message }, { status: 500 });
  }

  // asset毎に「最新の試行（ステータス問わず）」と「最新の完了済み」の両方を別々に残す
  // （失敗理由の表示にはステータス問わず最新を、スコア表示には完了済みのみを使う）。
  const latestAttemptByAssetId = new Map<string, (typeof runs)[number]>();
  const latestCompletedByAssetId = new Map<string, (typeof runs)[number]>();
  for (const run of runs ?? []) {
    if (!latestAttemptByAssetId.has(run.web_asset_id)) latestAttemptByAssetId.set(run.web_asset_id, run);
    if (run.status === "completed" && !latestCompletedByAssetId.has(run.web_asset_id)) {
      latestCompletedByAssetId.set(run.web_asset_id, run);
    }
  }

  const staleThreshold = Date.now() - RANKING_STALE_DAYS * 24 * 60 * 60 * 1000;

  const results = (webAssets ?? []).map((asset) => {
    const salon = salonById.get(asset.salon_id);
    const latestAttempt = latestAttemptByAssetId.get(asset.id) ?? null;
    const latestCompleted = latestCompletedByAssetId.get(asset.id) ?? null;
    const isStale = !latestCompleted || new Date(latestCompleted.created_at).getTime() < staleThreshold;

    return {
      webAssetId: asset.id,
      salonId: asset.salon_id,
      salonName: salon?.name ?? "（不明）",
      url: asset.url,
      isOwn: asset.id === ownWebAssetId,
      totalScore: latestCompleted?.total_score ?? null,
      totalMaxScore: latestCompleted?.total_max_score ?? null,
      diagnosedAt: latestCompleted?.created_at ?? null,
      latestAttemptStatus: latestAttempt?.status ?? null,
      crawlError: latestAttempt?.status === "failed" ? latestAttempt.crawl_error : null,
      needsAudit: isStale,
    };
  });

  const scored = results.filter((r) => r.totalScore !== null);
  const unscored = results.filter((r) => r.totalScore === null);
  scored.sort((a, b) => {
    const diff = b.totalScore! / (b.totalMaxScore || 1) - a.totalScore! / (a.totalMaxScore || 1);
    if (diff !== 0) return diff;
    return a.salonName.localeCompare(b.salonName, "ja");
  });
  unscored.sort((a, b) => a.salonName.localeCompare(b.salonName, "ja"));

  const ranked = [
    ...scored.map((r, i) => ({ ...r, rank: i + 1 })),
    ...unscored.map((r) => ({ ...r, rank: null as number | null })),
  ];

  return NextResponse.json({ staleDays: RANKING_STALE_DAYS, results: ranked });
}
