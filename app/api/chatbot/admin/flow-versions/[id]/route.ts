import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapFlowVersion } from "@/lib/chatbot/mappers";

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

  const admin = createAdminClient();
  const { error } = await admin.from("chatbot_flow_versions").update({ draft_json: body.draftJson }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
