import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapKnowledgeSource } from "@/lib/chatbot/mappers";

export async function GET(_request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { storeId } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chatbot_knowledge_sources")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sources: (data ?? []).map(mapKnowledgeSource) });
}

export async function POST(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { storeId } = await params;
  let body: { sourceType?: string; url?: string; manualText?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (body.sourceType !== "recruitment_lp" && body.sourceType !== "manual_url" && body.sourceType !== "manual_text") {
    return NextResponse.json({ error: "取得元種別が不正です" }, { status: 400 });
  }
  if (body.sourceType !== "manual_text" && (typeof body.url !== "string" || !body.url.trim())) {
    return NextResponse.json({ error: "URLが必要です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const isManualText = body.sourceType === "manual_text";
  const { data, error } = await admin
    .from("chatbot_knowledge_sources")
    .insert({
      store_id: storeId,
      source_type: body.sourceType,
      url: isManualText ? "" : body.url!.trim(),
      fetched_content: isManualText ? body.manualText ?? "" : "",
      status: isManualText ? "fetched" : "pending",
      fetched_at: isManualText ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id });
}
