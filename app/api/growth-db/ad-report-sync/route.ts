import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MetaAdsClient } from "@/lib/ad-platforms/meta-ads-client";
import { AdPlatform } from "@/lib/growth-db/ad-report-types";

export const runtime = "nodejs";
export const maxDuration = 30;

interface SyncRequestBody {
  platform: AdPlatform;
  accountId: string;
  yearMonth: string;
}

// /dashboard配下と同じくSupabase Authでログインしたスタッフのみ呼び出せる。
// META_ACCESS_TOKEN等の外部APIの秘密情報はサーバー側のみで扱い、ブラウザには渡さない。
// 取得したデータの保存（ad_reportsへのupsert）は、既存の方式通りクライアント側の
// Supabaseセッションで行うため、このルートはデータを取得して返すだけに留める。
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: SyncRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const { platform, accountId, yearMonth } = body;
  if (!platform || !accountId || !yearMonth) {
    return NextResponse.json({ error: "platform / accountId / yearMonth は必須です" }, { status: 400 });
  }

  if (platform !== "meta") {
    return NextResponse.json({ error: "Google広告のAPI連携は未実装です" }, { status: 501 });
  }

  try {
    const client = new MetaAdsClient();
    const data = await client.fetchMonthlyReport(accountId, yearMonth);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
