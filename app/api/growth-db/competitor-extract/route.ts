import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractCompetitorInfo } from "@/lib/ai/extractCompetitorInfo";

export const runtime = "nodejs";
export const maxDuration = 30;

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

  const result = await extractCompetitorInfo(
    body.name,
    body.area,
    typeof body.website === "string" ? body.website : undefined
  );
  return NextResponse.json(result ?? { attraction: {}, recruitment: {} });
}
