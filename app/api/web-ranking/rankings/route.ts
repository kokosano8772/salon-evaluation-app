import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 登録済みサイトを、直近の診断スコア順に並べたランキング一覧。
// site_type・prefectureでの絞り込みに対応する（設計書2.1「サイト種別ごとに
// 別々のランキング」/2.2「地域別ランキング」の仮実装。全国自動発見は未実装のため、
// あくまで登録済みサイトの中での並び替えに留まる）。
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const siteType = searchParams.get("siteType") ?? "";
  const prefecture = searchParams.get("prefecture") ?? "";

  const admin = createAdminClient();

  let assetQuery = admin.from("ranking_web_assets").select("*").eq("is_active", true);
  if (siteType) assetQuery = assetQuery.eq("site_type", siteType);
  const { data: webAssets, error: assetsError } = await assetQuery;
  if (assetsError) {
    return NextResponse.json({ error: assetsError.message }, { status: 500 });
  }
  if (!webAssets || webAssets.length === 0) {
    return NextResponse.json({ rankings: [] });
  }

  const salonIds = Array.from(new Set(webAssets.map((a) => a.salon_id)));
  let salonQuery = admin.from("ranking_salons").select("*").in("id", salonIds);
  if (prefecture) salonQuery = salonQuery.eq("prefecture", prefecture);
  const { data: salons, error: salonsError } = await salonQuery;
  if (salonsError) {
    return NextResponse.json({ error: salonsError.message }, { status: 500 });
  }
  const salonById = new Map((salons ?? []).map((s) => [s.id, s]));

  const assetIds = webAssets.map((a) => a.id);
  const { data: runs, error: runsError } = await admin
    .from("ranking_audit_runs")
    .select("*")
    .in("web_asset_id", assetIds)
    .eq("status", "completed")
    .order("created_at", { ascending: false });
  if (runsError) {
    return NextResponse.json({ error: runsError.message }, { status: 500 });
  }

  // web_asset毎に最新の完了済み診断だけを残す（ordered by created_at desc済みなので先勝ち）。
  const latestRunByAssetId = new Map<string, (typeof runs)[number]>();
  for (const run of runs ?? []) {
    if (!latestRunByAssetId.has(run.web_asset_id)) latestRunByAssetId.set(run.web_asset_id, run);
  }

  const rankings = webAssets
    .map((asset) => {
      const salon = salonById.get(asset.salon_id);
      if (!salon) return null; // prefecture絞り込みで対象外になったサロン
      const run = latestRunByAssetId.get(asset.id);
      return {
        webAssetId: asset.id,
        siteType: asset.site_type,
        url: asset.url,
        salonName: salon.name,
        prefecture: salon.prefecture,
        city: salon.city,
        totalScore: run?.total_score ?? null,
        totalMaxScore: run?.total_max_score ?? null,
        reviewStatus: run?.review_status ?? null,
        diagnosedAt: run?.created_at ?? null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => {
      // 未診断（スコア無し）は末尾に回す。設計書2.3「同点時の並び順ルールを明記」
      // への仮仕様として、まずスコア降順、次にサロン名の辞書順で安定させる。
      if (a.totalScore === null && b.totalScore === null) return a.salonName.localeCompare(b.salonName, "ja");
      if (a.totalScore === null) return 1;
      if (b.totalScore === null) return -1;
      const scoreDiff = (b.totalScore / (b.totalMaxScore || 1)) - (a.totalScore / (a.totalMaxScore || 1));
      if (scoreDiff !== 0) return scoreDiff;
      return a.salonName.localeCompare(b.salonName, "ja");
    });

  return NextResponse.json({ rankings });
}
