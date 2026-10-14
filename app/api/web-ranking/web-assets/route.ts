import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RankingSiteType } from "@/lib/web-ranking/types";

const VALID_SITE_TYPES: RankingSiteType[] = ["hp", "acquisition_lp", "recruitment_lp"];

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

  const salonId = typeof body.salonId === "string" ? body.salonId : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const siteType = typeof body.siteType === "string" ? body.siteType : "";
  if (!salonId || !url || !VALID_SITE_TYPES.includes(siteType as RankingSiteType)) {
    return NextResponse.json({ error: "salonId・url・siteTypeは必須です" }, { status: 400 });
  }
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "URLの形式が正しくありません" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ranking_web_assets")
    .insert({
      salon_id: salonId,
      site_type: siteType,
      url,
      label: typeof body.label === "string" ? body.label : "",
      registered_by: user.email ?? user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "登録に失敗しました" }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
