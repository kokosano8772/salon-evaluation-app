import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamCompetitorAnalysis } from "@/lib/ai/generateCompetitorAnalysis";
import type { AnalysisMode, ComparisonData, SalonData } from "@/lib/competitor-research/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AnalyzeRequestBody {
  salons: SalonData[];
  mode: AnalysisMode;
  cellData: ComparisonData;
}

// /dashboard配下と同じくSupabase Authでログインしたスタッフのみ呼び出せる。
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: AnalyzeRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const { salons, mode, cellData } = body;
  if (!salons?.length || !mode) {
    return NextResponse.json({ error: "salons と mode は必須です" }, { status: 400 });
  }

  try {
    const result = await streamCompetitorAnalysis(salons, mode, cellData ?? {});

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ error: `AI分析に失敗しました: ${message}` }, { status: 502 });
  }
}
