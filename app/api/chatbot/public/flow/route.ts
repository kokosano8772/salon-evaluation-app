import { NextResponse } from "next/server";
import { verifyBridgeKey, resolvePublishedBot } from "@/lib/chatbot/bridge-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authError = verifyBridgeKey(request);
  if (authError) return authError;

  const publicBotId = new URL(request.url).searchParams.get("bot");
  if (!publicBotId) return NextResponse.json({ error: "bot is required" }, { status: 400 });

  const bot = await resolvePublishedBot(publicBotId);
  if (!bot) return NextResponse.json({ error: "not found" }, { status: 404 });

  const admin = createAdminClient();
  // バージョン番号の大小ではなく、実際に公開した時刻が一番新しいものを表示する。
  // 番号順にすると、古いバージョンを選んで再公開しても、より番号の大きい
  // バージョンが公開済みのままだとそちらが優先されてしまい、「戻す」操作が
  // 見た目上できても実際には反映されないという不具合があったため。
  const { data, error } = await admin
    .from("chatbot_flow_versions")
    .select("version, published_json")
    .eq("store_id", bot.store_id)
    .not("published_json", "is", null)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "no published flow" }, { status: 404 });

  return NextResponse.json({ version: data.version, flow: data.published_json });
}
