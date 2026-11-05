import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Database } from "@/lib/supabase/database.types";

// 別Vercelプロジェクト（チャットボット本体）はSupabaseのservice_roleキーを
// 一切持たない。代わりにこのアプリが公開する /api/chatbot/public/* の
// 「ブリッジAPI」を、共有シークレット（ヘッダー）で認証して呼び出す。
// service_roleキーはこのアプリの外に出ないため、仮にブリッジ側の鍵が漏れても
// 影響範囲はチャットボット関連の、かつこのAPIが明示的に返すフィールドだけに
// 限定される（stores等の既存業務データには到達できない）。
export function verifyBridgeKey(request: Request): NextResponse | null {
  const expected = process.env.CHATBOT_BRIDGE_API_KEY;
  if (!expected) {
    // 未設定時はフェイルクローズ。別Vercelプロジェクトがまだ存在しないP1の
    // 段階では、このエンドポイント群は実質無効化されたままでよい。
    return NextResponse.json({ error: "chatbot bridge is not configured" }, { status: 503 });
  }
  const provided = request.headers.get("x-chatbot-bridge-key");
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

type BotConfigRow = Database["public"]["Tables"]["chatbot_bot_configs"]["Row"];

// 公開中(status='published')のボットのみを対象にする。draft/archivedは
// 「存在しない」のと同じ扱いで404にし、内部状態を外部に漏らさない。
export async function resolvePublishedBot(publicBotId: string): Promise<BotConfigRow | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("chatbot_bot_configs").select("*").eq("public_bot_id", publicBotId).maybeSingle();
  if (!data || data.status !== "published") return null;
  return data;
}

// JST基準の日付（YYYY-MM-DD）。chatbot_usage_dailyの集計粒度と合わせる。
export function todayInJst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}
