import { NextResponse } from "next/server";
import { verifyBridgeKey, resolvePublishedBot, todayInJst } from "@/lib/chatbot/bridge-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// 個人情報を含まない匿名集計のみを記録する（会話内容・応募内容は受け取らない）。
// chatbot_increment_usage（Postgres関数）でDB側に加算させることで、複数リクエストが
// 同時に呼んでもカウントが欠落しない（読んで+1して書き戻す方式の競合を避ける）。
export async function POST(request: Request) {
  const authError = verifyBridgeKey(request);
  if (authError) return authError;

  let body: {
    bot?: string;
    chatMessageCount?: number;
    aiResponseCount?: number;
    inputTokens?: number;
    outputTokens?: number;
    estimatedCostUsd?: number;
    applicationSuccessCount?: number;
    applicationFailureCount?: number;
    widgetLoadCount?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (typeof body.bot !== "string" || !body.bot) {
    return NextResponse.json({ error: "bot is required" }, { status: 400 });
  }

  const bot = await resolvePublishedBot(body.bot);
  if (!bot) return NextResponse.json({ error: "not found" }, { status: 404 });

  const num = (v: number | undefined) => (Number.isFinite(v) ? Math.max(0, Math.round(v!)) : 0);

  const admin = createAdminClient();
  const { error } = await admin.rpc("chatbot_increment_usage", {
    p_store_id: bot.store_id,
    p_date: todayInJst(),
    p_chat_message_count: num(body.chatMessageCount),
    p_ai_response_count: num(body.aiResponseCount),
    p_input_tokens: num(body.inputTokens),
    p_output_tokens: num(body.outputTokens),
    p_estimated_cost_usd: Number.isFinite(body.estimatedCostUsd) ? Math.max(0, body.estimatedCostUsd!) : 0,
    p_application_success_count: num(body.applicationSuccessCount),
    p_application_failure_count: num(body.applicationFailureCount),
    p_widget_load_count: num(body.widgetLoadCount),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
