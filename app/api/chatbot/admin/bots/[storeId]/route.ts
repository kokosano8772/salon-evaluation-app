import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapBotConfig } from "@/lib/chatbot/mappers";
import { Database } from "@/lib/supabase/database.types";

type BotConfigUpdate = Database["public"]["Tables"]["chatbot_bot_configs"]["Update"];

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

  const { data: store, error: storeError } = await admin.from("stores").select("id, name").eq("id", storeId).maybeSingle();
  if (storeError || !store) {
    return NextResponse.json({ error: "店舗が見つかりませんでした" }, { status: 404 });
  }

  const { data: bot, error } = await admin.from("chatbot_bot_configs").select("*").eq("store_id", storeId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ store, bot: bot ? mapBotConfig(bot) : null });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { storeId } = await params;

  let body: {
    status?: "draft" | "published" | "archived";
    mode?: "choice" | "ai" | "hybrid";
    allowedDomains?: string[];
    theme?: Record<string, unknown>;
    rateLimitPerMinute?: number;
    rateLimitPerDay?: number;
    aiMonthlyTokenLimit?: number | null;
    aiMonthlyCostLimitUsd?: number | null;
    draftSystemPrompt?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("chatbot_bot_configs")
    .select("id")
    .eq("store_id", storeId)
    .maybeSingle();
  if (currentError || !current) {
    return NextResponse.json({ error: "チャットボット設定が見つかりませんでした" }, { status: 404 });
  }

  const update: BotConfigUpdate = { updated_by: user.email ?? user.id };
  if (body.status !== undefined) update.status = body.status;
  if (body.mode !== undefined) update.mode = body.mode;
  if (body.allowedDomains !== undefined) {
    update.allowed_domains = body.allowedDomains.map((d) => d.trim()).filter(Boolean);
  }
  if (body.theme !== undefined) update.theme = body.theme;
  if (body.rateLimitPerMinute !== undefined && Number.isFinite(body.rateLimitPerMinute)) {
    update.rate_limit_per_minute = Math.max(1, Math.round(body.rateLimitPerMinute));
  }
  if (body.rateLimitPerDay !== undefined && Number.isFinite(body.rateLimitPerDay)) {
    update.rate_limit_per_day = Math.max(1, Math.round(body.rateLimitPerDay));
  }
  if (body.aiMonthlyTokenLimit !== undefined) {
    update.ai_monthly_token_limit = body.aiMonthlyTokenLimit === null ? null : Math.round(body.aiMonthlyTokenLimit);
  }
  if (body.aiMonthlyCostLimitUsd !== undefined) {
    update.ai_monthly_cost_limit_usd = body.aiMonthlyCostLimitUsd;
  }
  if (body.draftSystemPrompt !== undefined) update.draft_system_prompt = body.draftSystemPrompt;

  const { error } = await admin.from("chatbot_bot_configs").update(update).eq("store_id", storeId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
