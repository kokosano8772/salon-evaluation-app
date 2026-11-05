import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapBotConfig } from "@/lib/chatbot/mappers";
import { BotSummary } from "@/components/chatbot/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: bots, error } = await admin.from("chatbot_bot_configs").select("*").order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const storeIds = Array.from(new Set((bots ?? []).map((b) => b.store_id)));
  const { data: stores } = await admin.from("stores").select("id, name").in("id", storeIds.length > 0 ? storeIds : [""]);
  const storeNameById = new Map((stores ?? []).map((s) => [s.id, s.name]));

  const result: BotSummary[] = (bots ?? []).map((row) => {
    const bot = mapBotConfig(row);
    return {
      id: bot.id,
      storeId: bot.storeId,
      storeName: storeNameById.get(bot.storeId) ?? "(店舗不明)",
      publicBotId: bot.publicBotId,
      status: bot.status,
      mode: bot.mode,
      updatedAt: bot.updatedAt,
    };
  });

  return NextResponse.json({ bots: result });
}

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

  const { data: existing } = await admin.from("chatbot_bot_configs").select("id").eq("store_id", body.storeId).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "この店舗には既にチャットボット設定があります" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("chatbot_bot_configs")
    .insert({ store_id: body.storeId, created_by: user.email ?? user.id, updated_by: user.email ?? user.id })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id });
}
