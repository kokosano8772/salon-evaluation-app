import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamAdReportAnalysis } from "@/lib/ai/generateAdReportAnalysis";
import { AdReportComparison, CampaignAnalysis, GrowthLinkComparison } from "@/lib/growth-db/ad-report-analysis";
import { AdReport } from "@/lib/growth-db/ad-report-types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AnalyzeRequestBody {
  report: AdReport;
  comparison: AdReportComparison;
  campaignAnalysis: CampaignAnalysis;
  growthComparison: GrowthLinkComparison;
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

  const { report, comparison, campaignAnalysis, growthComparison } = body;
  if (!report || !comparison || !campaignAnalysis || !growthComparison) {
    return NextResponse.json({ error: "report/comparison/campaignAnalysis/growthComparison は必須です" }, { status: 400 });
  }

  try {
    const result = await streamAdReportAnalysis(report, comparison, campaignAnalysis, growthComparison);

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
