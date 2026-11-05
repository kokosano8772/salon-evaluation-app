import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateFlow } from "@/lib/chatbot/flow-validation";

// draft_jsonをpublished_jsonへコピーする。ブリッジAPI（/api/chatbot/public/flow）は
// 常にpublished_jsonのみを返すため、編集中の下書きは公開済みチャットボットに影響しない。
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: current, error: currentError } = await admin
    .from("chatbot_flow_versions")
    .select("draft_json")
    .eq("id", id)
    .maybeSingle();
  if (currentError || !current) {
    return NextResponse.json({ error: "フローが見つかりませんでした" }, { status: 404 });
  }

  const draft = (current.draft_json as Record<string, unknown>) ?? {};
  const validation = validateFlow(draft);
  if (!validation.ok) {
    return NextResponse.json({ error: "公開前検証に失敗しました", details: validation.errors }, { status: 400 });
  }

  const { error } = await admin
    .from("chatbot_flow_versions")
    .update({ published_json: draft, published_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
