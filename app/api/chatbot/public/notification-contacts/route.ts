import { NextResponse } from "next/server";
import { verifyBridgeKey, resolvePublishedBot } from "@/lib/chatbot/bridge-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// 応募メールの送信先を返す。別Vercelプロジェクトの「サーバー側」からのみ
// 呼ばれる想定（ウィジェットJS=ブラウザから直接叩かせない）。応募者本人の
// 氏名・メール等はこのAPIの対象外で、ここが返すのは常にサロン側の担当者連絡先のみ。
export async function GET(request: Request) {
  const authError = verifyBridgeKey(request);
  if (authError) return authError;

  const publicBotId = new URL(request.url).searchParams.get("bot");
  if (!publicBotId) return NextResponse.json({ error: "bot is required" }, { status: 400 });

  const bot = await resolvePublishedBot(publicBotId);
  if (!bot) return NextResponse.json({ error: "not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chatbot_notification_contacts")
    .select("email, name, is_primary")
    .eq("store_id", bot.store_id)
    .eq("is_active", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    contacts: (data ?? []).map((c) => ({ email: c.email, name: c.name, isPrimary: c.is_primary })),
  });
}
