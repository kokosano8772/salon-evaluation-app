import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchWebsiteText } from "@/lib/competitor-research/fetch-website-text";
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

  let body: { name?: unknown; url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (typeof body.name !== "string" || typeof body.url !== "string") {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const text = await fetchWebsiteText(body.url);
  if (!text) {
    return NextResponse.json({ attraction: {}, recruitment: {} });
  }

  const result = await extractCompetitorInfo(body.name, text);
  return NextResponse.json(result ?? { attraction: {}, recruitment: {} });
}
