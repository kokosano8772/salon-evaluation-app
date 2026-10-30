import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 診断結果の保管庫から、診断結果とstoresを手動で連携／付け替える。
// - AIチェック（ai_check_diagnoses）: URL不一致などで自動連携（URL正規化）
//   できないケースの補助。linked_store_idの上書きで、nullを渡すと自動連携に戻せる。
// - 価値診断（diagnosis_results）: 電話番号＋氏名の一致でfind-or-createする
//   仕組み上、入力がわずかにズレると別の新規店舗として重複登録されてしまう
//   ことがあるため、既存の正しい店舗へstore_idを直接付け替えられるようにする。
//   こちらは元々store_idが必須のレコードのため、nullへの解除は許可しない
//   （解除すると参照先ページ自体が無くなってしまうため）。
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { kind?: string; diagnosisId?: string; storeId?: string | null };
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
  if (body.kind !== "ai_check" && body.kind !== "value_diagnosis") {
    return NextResponse.json({ error: "kindが不正です" }, { status: 400 });
  }
  if (body.kind === "value_diagnosis" && body.storeId === null) {
    return NextResponse.json({ error: "価値診断は連携の解除はできません（店舗の付け替えのみ）" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } =
    body.kind === "ai_check"
      ? await admin.from("ai_check_diagnoses").update({ linked_store_id: body.storeId }).eq("id", body.diagnosisId)
      : await admin.from("diagnosis_results").update({ store_id: body.storeId }).eq("id", body.diagnosisId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
