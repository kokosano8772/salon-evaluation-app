import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapUsageDay } from "@/lib/chatbot/mappers";

// ?month=YYYY-MM（省略時は当月）のchatbot_usage_dailyを集計して返す。
// レート制限（不正利用対策、別Vercel側のKV/Redisで管理）とは分離した、
// AI利用料金・トークン使用量の集計専用API。
export async function GET(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { storeId } = await params;
  const monthParam = new URL(request.url).searchParams.get("month");
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : new Date().toISOString().slice(0, 7);
  const [year, mon] = month.split("-").map(Number);
  const startDate = `${month}-01`;
  const endDate = new Date(Date.UTC(mon === 12 ? year + 1 : year, mon === 12 ? 0 : mon, 1)).toISOString().slice(0, 10);

  const admin = createAdminClient();
  const [{ data: days, error }, { data: bot }] = await Promise.all([
    admin
      .from("chatbot_usage_daily")
      .select("*")
      .eq("store_id", storeId)
      .gte("date", startDate)
      .lt("date", endDate)
      .order("date"),
    admin
      .from("chatbot_bot_configs")
      .select("ai_monthly_token_limit, ai_monthly_cost_limit_usd")
      .eq("store_id", storeId)
      .maybeSingle(),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const mapped = (days ?? []).map(mapUsageDay);
  const totals = mapped.reduce(
    (acc, d) => ({
      chatMessageCount: acc.chatMessageCount + d.chatMessageCount,
      aiResponseCount: acc.aiResponseCount + d.aiResponseCount,
      inputTokens: acc.inputTokens + d.inputTokens,
      outputTokens: acc.outputTokens + d.outputTokens,
      estimatedCostUsd: acc.estimatedCostUsd + d.estimatedCostUsd,
      applicationSuccessCount: acc.applicationSuccessCount + d.applicationSuccessCount,
      applicationFailureCount: acc.applicationFailureCount + d.applicationFailureCount,
      widgetLoadCount: acc.widgetLoadCount + d.widgetLoadCount,
    }),
    {
      chatMessageCount: 0,
      aiResponseCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      applicationSuccessCount: 0,
      applicationFailureCount: 0,
      widgetLoadCount: 0,
    }
  );

  return NextResponse.json({
    month,
    days: mapped,
    totals,
    aiMonthlyTokenLimit: bot?.ai_monthly_token_limit ?? null,
    aiMonthlyCostLimitUsd: bot?.ai_monthly_cost_limit_usd ?? null,
  });
}
