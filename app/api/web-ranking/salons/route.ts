import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// /dashboard配下と同じくSupabase Authでログインしたスタッフのみ呼び出せる
// （ranking_salonsはRLSで全ロールをブロックしているため、ログイン確認は
// このAPIルート自身の責務になる。competitor-search/route.ts と同じパターン）。
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "サロン名を入力してください" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ranking_salons")
    .insert({
      name,
      business_category: typeof body.businessCategory === "string" ? body.businessCategory : "hair_salon",
      prefecture: typeof body.prefecture === "string" ? body.prefecture : "",
      city: typeof body.city === "string" ? body.city : "",
      address: typeof body.address === "string" ? body.address : "",
      store_count: typeof body.storeCount === "number" ? body.storeCount : null,
      notes: typeof body.notes === "string" ? body.notes : "",
      created_by: user.email ?? user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "登録に失敗しました" }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: salons, error } = await admin.from("ranking_salons").select("*").order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const salonIds = (salons ?? []).map((s) => s.id);
  const { data: webAssets, error: assetsError } = await admin
    .from("ranking_web_assets")
    .select("*")
    .in("salon_id", salonIds.length > 0 ? salonIds : [""]);
  if (assetsError) {
    return NextResponse.json({ error: assetsError.message }, { status: 500 });
  }

  const assetsBySalonId = new Map<string, typeof webAssets>();
  for (const asset of webAssets ?? []) {
    const list = assetsBySalonId.get(asset.salon_id) ?? [];
    list.push(asset);
    assetsBySalonId.set(asset.salon_id, list);
  }

  return NextResponse.json({
    salons: (salons ?? []).map((s) => ({ ...s, webAssets: assetsBySalonId.get(s.id) ?? [] })),
  });
}
