import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 診断結果の保管庫から、AIチェック診断とstoresを手動で連携／解除する。
// URL不一致などで自動連携（URL正規化）できないケースのための補助機能。
// diagnosis_results（価値診断）側は既にstore_idで直接リンク済みのため対象外。
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { diagnosisId?: string; storeId?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  if (typeof body.diagnosisId !== "string" || !body.diagnosisId) {
    return NextResponse.json({ error: "diagnosisIdが必要です" }, { status: 400 });
  }
  if (body.storeId !== null && typeof body.storeId !== "string") {
    return NextResponse.json({ error: "storeIdが不正です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("ai_check_diagnoses")
    .update({ linked_store_id: body.storeId })
    .eq("id", body.diagnosisId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
