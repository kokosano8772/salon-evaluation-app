import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapFlowVersion } from "@/lib/chatbot/mappers";
import { validateApplyActionFields } from "@/lib/chatbot/flow-validation";

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
  const { data, error } = await admin.from("chatbot_flow_versions").select("*").eq("id", id).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "フローが見つかりませんでした" }, { status: 404 });

  return NextResponse.json({ version: mapFlowVersion(data) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { draftJson?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (typeof body.draftJson !== "object" || body.draftJson === null) {
    return NextResponse.json({ error: "draftJsonが必要です" }, { status: 400 });
  }

  // 構造（開始ノードの数・参照切れ等）は下書き保存時点では未完成でもよいが、
  // 応募導線のURL・電話番号の安全性は保存時から必ず確認する
  // （不正なスキームが一度でもDBに保存されることを防ぐため）。
  const fieldsResult = validateApplyActionFields(body.draftJson);
  if (!fieldsResult.ok) {
    return NextResponse.json({ error: "応募導線の設定が不正です", details: fieldsResult.errors }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("chatbot_flow_versions").update({ draft_json: body.draftJson }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
