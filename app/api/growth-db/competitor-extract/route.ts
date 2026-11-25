import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractCompetitorInfo } from "@/lib/ai/extractCompetitorInfo";

export const runtime = "nodejs";
// GeminiがGoogle検索しながら調べる処理は30秒を超えることがあり、特に
// withRetry（gemini.ts）でリトライが1回でも入ると30秒を超えてVercel側に
// 504で打ち切られていた。Proプランなのでもっと伸ばせる余裕がある。
export const maxDuration = 60;

// /dashboard配下と同じくSupabase Authでログインしたスタッフのみ呼び出せる。
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { name?: unknown; area?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (typeof body.name !== "string" || typeof body.area !== "string") {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  try {
    const result = await extractCompetitorInfo(
      body.name,
      body.area,
      typeof body.website === "string" ? body.website : undefined
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "競合情報の取得に失敗しました";
    console.error(`competitor-extract failed for ${body.name}:`, message);
    return NextResponse.json({ error: message, attraction: {}, recruitment: {} }, { status: 502 });
  }
}
