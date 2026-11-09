import { NextResponse } from "next/server";
import { verifyBridgeKey, resolvePublishedBot } from "@/lib/chatbot/bridge-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ウィジェット（iframe側ページ）の初期表示に必要な最小限の設定のみを返す。
// store_id・プロンプト・通知先メール等は一切含めない。storeName（店舗名）のみ、
// チャット画面でどのサロンの求人チャットかを表示するために例外的に含める
// （stores.nameは元々diagnosis_results等でも非機密情報として扱われている）。
export async function GET(request: Request) {
  const authError = verifyBridgeKey(request);
  if (authError) return authError;

  const publicBotId = new URL(request.url).searchParams.get("bot");
  if (!publicBotId) return NextResponse.json({ error: "bot is required" }, { status: 400 });

  const bot = await resolvePublishedBot(publicBotId);
  if (!bot) return NextResponse.json({ error: "not found" }, { status: 404 });

  const admin = createAdminClient();
  const { data: store } = await admin.from("stores").select("name").eq("id", bot.store_id).maybeSingle();

  return NextResponse.json({
    mode: bot.mode,
    theme: bot.theme,
    allowedDomains: bot.allowed_domains,
    rateLimitPerMinute: bot.rate_limit_per_minute,
    rateLimitPerDay: bot.rate_limit_per_day,
    storeName: store?.name ?? "",
  });
}
