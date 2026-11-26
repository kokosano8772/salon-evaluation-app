import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapStoreRow } from "@/lib/growth-db/repository";
import { splitPrefectureCity } from "@/lib/web-ranking/area-split";

// 成長データベースのstoreと、WEBランキング機能のranking_salons/ranking_web_assetsを
// 紐付ける窓口。lib/growth-db/repository.tsのgetStore()はブラウザ用createClient()を
// 使っておりAPIルートから呼べないため、取得自体はここでcreateAdminClient()を使い、
// 行→Store型への変換だけmapStoreRow()（純粋関数）を再利用する。
async function findOwnAsset(storeId: string) {
  const admin = createAdminClient();
  const { data: salon } = await admin.from("ranking_salons").select("*").eq("linked_store_id", storeId).maybeSingle();
  if (!salon) return { salon: null, webAsset: null, latestRun: null };

  const { data: webAsset } = await admin
    .from("ranking_web_assets")
    .select("*")
    .eq("salon_id", salon.id)
    .eq("site_type", "hp")
    .eq("is_active", true)
    .maybeSingle();
  if (!webAsset) return { salon, webAsset: null, latestRun: null };

  const { data: latestRun } = await admin
    .from("ranking_audit_runs")
    .select("*")
    .eq("web_asset_id", webAsset.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { salon, webAsset, latestRun };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId") ?? "";
  if (!storeId) {
    return NextResponse.json({ error: "storeIdを指定してください" }, { status: 400 });
  }

  const { salon, webAsset, latestRun } = await findOwnAsset(storeId);
  return NextResponse.json({
    salonId: salon?.id ?? null,
    webAssetId: webAsset?.id ?? null,
    url: webAsset?.url ?? null,
    latestRun: latestRun
      ? {
          status: latestRun.status,
          totalScore: latestRun.total_score,
          totalMaxScore: latestRun.total_max_score,
          createdAt: latestRun.created_at,
        }
      : null,
  });
}

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
  const storeId = typeof body.storeId === "string" ? body.storeId : "";
  if (!storeId) {
    return NextResponse.json({ error: "storeIdを指定してください" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: storeRow, error: storeError } = await admin
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle();
  if (storeError || !storeRow) {
    return NextResponse.json({ error: "店舗が見つかりませんでした" }, { status: 404 });
  }
  const store = mapStoreRow(storeRow);

  const ownUrl = store.homepageUrls[0]?.url?.trim();
  if (!ownUrl) {
    return NextResponse.json(
      {
        error: "この店舗にはホームページURLが登録されていません。店舗情報の編集画面で「ホームページURL」を登録してから再度お試しください。",
        code: "NO_OWN_URL",
      },
      { status: 400 }
    );
  }

  // 1. ranking_salons: 自社行をfind-or-create
  let { data: salon } = await admin.from("ranking_salons").select("*").eq("linked_store_id", storeId).maybeSingle();
  if (!salon) {
    const { prefecture, city } = splitPrefectureCity(store.area);
    const { data: created, error: createSalonError } = await admin
      .from("ranking_salons")
      .insert({
        name: store.name,
        business_category: "hair_salon",
        prefecture,
        city,
        address: store.area,
        store_count: store.storeCount,
        linked_store_id: storeId,
        created_by: user.email ?? user.id,
      })
      .select("*")
      .single();
    if (createSalonError || !created) {
      return NextResponse.json({ error: createSalonError?.message ?? "自社サロンの登録に失敗しました" }, { status: 500 });
    }
    salon = created;
  } else if (salon.name !== store.name) {
    await admin.from("ranking_salons").update({ name: store.name }).eq("id", salon.id);
  }

  // 2. ranking_web_assets: 自社サイトをfind-or-create（URLが変わっていたら旧行は非アクティブ化し、
  //    過去の診断結果の意味を壊さないよう新規行として登録する）。
  const { data: existingAsset } = await admin
    .from("ranking_web_assets")
    .select("*")
    .eq("salon_id", salon.id)
    .eq("site_type", "hp")
    .eq("is_active", true)
    .maybeSingle();

  let webAssetId: string;
  if (existingAsset && existingAsset.url === ownUrl) {
    webAssetId = existingAsset.id;
  } else {
    if (existingAsset) {
      await admin.from("ranking_web_assets").update({ is_active: false }).eq("id", existingAsset.id);
    }
    const { data: createdAsset, error: createAssetError } = await admin
      .from("ranking_web_assets")
      .insert({
        salon_id: salon.id,
        site_type: "hp",
        url: ownUrl,
        label: "自社サイト",
        registered_by: user.email ?? user.id,
      })
      .select("id")
      .single();
    if (createAssetError || !createdAsset) {
      return NextResponse.json({ error: createAssetError?.message ?? "自社サイトの登録に失敗しました" }, { status: 500 });
    }
    webAssetId = createdAsset.id;
  }

  return NextResponse.json({ salonId: salon.id, webAssetId, url: ownUrl });
}
