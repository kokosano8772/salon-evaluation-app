import { NextResponse } from "next/server";
import { verifyBridgeKey, resolvePublishedBot } from "@/lib/chatbot/bridge-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// AI呼び出し前の予算チェック用。当月のトークン使用量・概算費用の合計と、
// 管理画面（基本設定）で店舗ごとに設定した上限を返す。実際にOpenAI APIを
// 呼ぶかどうかの判断はP2側（別Vercelプロジェクト）が行う。
export async function GET(request: Request) {
  const authError = verifyBridgeKey(request);
  if (authError) return authError;

  const publicBotId = new URL(request.url).searchParams.get("bot");
  if (!publicBotId) return NextResponse.json({ error: "bot is required" }, { status: 400 });

  const bot = await resolvePublishedBot(publicBotId);
  if (!bot) return NextResponse.json({ error: "not found" }, { status: 404 });

  const now = new Date();
  const startDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const endDate = nextMonth.toISOString().slice(0, 10);

  const admin = createAdminClient();
  const { data: days, error } = await admin
    .from("chatbot_usage_daily")
    .select("input_tokens, output_tokens, estimated_cost_usd")
    .eq("store_id", bot.store_id)
    .gte("date", startDate)
    .lt("date", endDate);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const totals = (days ?? []).reduce(
    (acc, d) => ({
      tokens: acc.tokens + d.input_tokens + d.output_tokens,
      costUsd: acc.costUsd + d.estimated_cost_usd,
    }),
    { tokens: 0, costUsd: 0 }
  );

  return NextResponse.json({
    currentMonthTokens: totals.tokens,
    currentMonthCostUsd: totals.costUsd,
    tokenLimit: bot.ai_monthly_token_limit,
    costLimitUsd: bot.ai_monthly_cost_limit_usd,
  });
}
