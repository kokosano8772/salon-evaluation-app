import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 診断結果の保管庫から、診断結果そのもの（Supabase上の実データ）を削除する。
// 今後データ量がSupabaseの保存容量の上限に近づいた場合に、古い・不要な診断結果を
// 保管庫から直接整理できるようにするための機能（単に保管庫の表示から隠すのではなく、
// 元のURL（/ai-check/[id]等）にアクセスしても二度と見れなくなる、不可逆な削除）。
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { kind?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  if (typeof body.id !== "string" || !body.id) {
    return NextResponse.json({ error: "idが必要です" }, { status: 400 });
  }
  if (body.kind !== "ai_check" && body.kind !== "value_diagnosis") {
    return NextResponse.json({ error: "kindが不正です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const table = body.kind === "ai_check" ? "ai_check_diagnoses" : "diagnosis_results";
  const { error } = await admin.from(table).delete().eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
