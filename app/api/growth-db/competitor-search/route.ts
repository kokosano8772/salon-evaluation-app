import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchSalons } from "@/lib/competitor-research/search-service";
import type { SearchRequest } from "@/lib/competitor-research/search-types";

// /dashboard配下と同じくSupabase Authでログインしたスタッフのみ呼び出せる。
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Partial<SearchRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const region = typeof body.region === "string" ? body.region.trim() : "";
  if (!region) {
    return NextResponse.json({ error: "エリアを入力してください" }, { status: 400 });
  }
  if (region.length > 100) {
    return NextResponse.json({ error: "エリア名が長すぎます" }, { status: 400 });
  }
  if (typeof body.mode !== "string") {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  try {
    const result = await searchSalons({
      region,
      mode: body.mode as SearchRequest["mode"],
      genre: body.genre,
      sortBy: body.sortBy,
      page: Math.max(1, body.page ?? 1),
      perPage: Math.min(50, Math.max(10, body.perPage ?? 20)),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Competitor search failed:", error);
    return NextResponse.json({ error: "検索に失敗しました" }, { status: 502 });
  }
}
