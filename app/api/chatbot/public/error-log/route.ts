import { NextResponse } from "next/server";
import { verifyBridgeKey, resolvePublishedBot } from "@/lib/chatbot/bridge-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const ERROR_SOURCES = ["ai", "email", "fetch", "flow", "rate_limit", "other"] as const;

// 個人情報を含まない技術的エラーのみを受け付ける。messageに応募者氏名や
// チャット本文を入れないのは呼び出し側（別Vercelプロジェクト）の責務だが、
// ここでも長さを制限し、万一の巨大なリクエストボディの貼り付けを防ぐ。
export async function POST(request: Request) {
  const authError = verifyBridgeKey(request);
  if (authError) return authError;

  let body: { bot?: string; errorCode?: string; errorSource?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (typeof body.errorCode !== "string" || !body.errorCode) {
    return NextResponse.json({ error: "errorCode is required" }, { status: 400 });
  }
  if (typeof body.errorSource !== "string" || !ERROR_SOURCES.includes(body.errorSource as (typeof ERROR_SOURCES)[number])) {
    return NextResponse.json({ error: "errorSource is invalid" }, { status: 400 });
  }

  const storeId = typeof body.bot === "string" && body.bot ? (await resolvePublishedBot(body.bot))?.store_id ?? null : null;

  const admin = createAdminClient();
  const { error } = await admin.from("chatbot_error_logs").insert({
    store_id: storeId,
    error_code: body.errorCode.slice(0, 100),
    error_source: body.errorSource as (typeof ERROR_SOURCES)[number],
    message: (body.message ?? "").slice(0, 500),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
