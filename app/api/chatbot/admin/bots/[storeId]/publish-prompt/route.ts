import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 下書きのシステムプロンプトを公開版へコピーする。ブリッジAPI
// （/api/chatbot/public/knowledge）はpublished_system_promptのみを返すため、
// このエンドポイントを呼ぶまで編集中のプロンプトは公開中のボットに反映されない。
export async function POST(_request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { storeId } = await params;
  const admin = createAdminClient();

  const { data: current, error: currentError } = await admin
    .from("chatbot_bot_configs")
    .select("draft_system_prompt")
    .eq("store_id", storeId)
    .maybeSingle();
  if (currentError || !current) {
    return NextResponse.json({ error: "チャットボット設定が見つかりませんでした" }, { status: 404 });
  }

  const { error } = await admin
    .from("chatbot_bot_configs")
    .update({
      published_system_prompt: current.draft_system_prompt,
      prompt_published_at: new Date().toISOString(),
      prompt_published_by: user.email ?? user.id,
      updated_by: user.email ?? user.id,
    })
    .eq("store_id", storeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
