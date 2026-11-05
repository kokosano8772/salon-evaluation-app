import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapFlowVersion } from "@/lib/chatbot/mappers";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const storeId = new URL(request.url).searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeIdが必要です" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chatbot_flow_versions")
    .select("*")
    .eq("store_id", storeId)
    .order("version", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ versions: (data ?? []).map(mapFlowVersion) });
}

// 新しい下書きバージョンを作る。直前のバージョンのdraft_jsonを引き継いで
// 続きを編集できるようにする（無ければ空のフローから開始）。
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { storeId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (typeof body.storeId !== "string" || !body.storeId) {
    return NextResponse.json({ error: "storeIdが必要です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: latest } = await admin
    .from("chatbot_flow_versions")
    .select("version, draft_json")
    .eq("store_id", body.storeId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await admin
    .from("chatbot_flow_versions")
    .insert({
      store_id: body.storeId,
      version: (latest?.version ?? 0) + 1,
      draft_json: latest?.draft_json ?? {},
      created_by: user.email ?? user.id,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id });
}
