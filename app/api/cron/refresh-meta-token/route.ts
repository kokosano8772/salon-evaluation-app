import { NextResponse } from "next/server";
import { refreshMetaTokenIfNeeded } from "@/lib/ad-platforms/meta-token-store";

export const runtime = "nodejs";

// Vercel Cronから毎日呼ばれ、Metaのシステムユーザートークンが期限切れ間近なら自動延長する。
// Vercel側でCRON_SECRET環境変数を設定していると、Cronからのリクエストには自動で
// `Authorization: Bearer ${CRON_SECRET}` が付与されるため、それを検証して外部からの
// 不正な呼び出しを防ぐ。
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshMetaTokenIfNeeded();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
