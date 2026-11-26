import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchSalons } from "@/lib/competitor-research/search-service";
import type { SalonGenre } from "@/lib/competitor-research/types";

// 地域を1つ指定して候補サロンを検索するプレビューAPI（実際の登録はしない）。
// 全国を一括で自動発見するのは既存の競合検索の規模的に無理だが、地域を1つに
// 絞った検索であれば、既存のlib/competitor-research/search-service.ts
// （Google Places優先・HotPepperフォールバック）をそのまま使える規模になる。
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

  const prefecture = typeof body.prefecture === "string" ? body.prefecture.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";
  const genre = (typeof body.genre === "string" ? body.genre : "hair") as SalonGenre;
  if (!prefecture) {
    return NextResponse.json({ error: "都道府県を入力してください" }, { status: 400 });
  }

  const region = `${prefecture}${city}`;
  let result;
  try {
    result = await searchSalons({ region, mode: "attraction", genre, perPage: 20 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "検索に失敗しました";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Google Places/HotPepperのAPIキーが無い環境ではモックデータにフォールバックする
  // 仕様になっている（lib/competitor-research/search-service.ts）。実データのふりを
  // した架空のサロンをランキングに紛れ込ませないよう、モックの場合は明示的に拒否する。
  if (result.source === "mock") {
    return NextResponse.json(
      { error: "検索プロバイダのAPIキーが設定されていないため、実際の候補を取得できませんでした" },
      { status: 502 }
    );
  }

  const foundCount = result.salons.length;
  const withWebsite = result.salons.filter((s) => !!s.website);

  const admin = createAdminClient();
  const urls = withWebsite.map((s) => s.website!);
  const { data: existingAssets } = await admin.from("ranking_web_assets").select("id, url").in("url", urls.length > 0 ? urls : [""]);
  const existingUrlToIdMap = new Map((existingAssets ?? []).map((a) => [a.url, a.id]));

  const candidates = withWebsite.map((s) => ({
    name: s.name,
    area: s.area,
    address: s.address ?? "",
    website: s.website!,
    rating: s.rating,
    reviewCount: s.reviewCount,
    alreadyRegistered: existingUrlToIdMap.has(s.website!),
    // 既に登録済みの場合はそのweb_asset.idを返し、呼び出し側が二重登録せず
    // そのまま診断対象に使い回せるようにする（store-ranking機能で利用）。
    webAssetId: existingUrlToIdMap.get(s.website!) ?? null,
  }));

  return NextResponse.json({
    source: result.source,
    foundCount,
    withWebsiteCount: withWebsite.length,
    candidates,
  });
}
