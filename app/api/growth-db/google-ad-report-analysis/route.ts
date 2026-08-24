import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { streamGoogleAdReportAnalysis } from "@/lib/ai/generateGoogleAdReportAnalysis";
import { AdReportComparison, GrowthLinkComparison } from "@/lib/growth-db/ad-report-analysis";
import { YoyTrend } from "@/lib/growth-db/ad-report-trend";
import { AdReport } from "@/lib/growth-db/ad-report-types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AnalyzeRequestBody {
  report: AdReport;
  comparison: AdReportComparison;
  growthComparison: GrowthLinkComparison;
  trend: YoyTrend;
  homepageUrl?: string;
  hotpepperUrl?: string;
  recruitmentLpUrl?: string;
}

// /dashboard配下と同じくSupabase Authでログインしたスタッフのみ呼び出せる。
// Meta用の /api/growth-db/ad-report-analysis とは完全に別ルートにし、Meta側の挙動には
// 一切影響を与えないようにする。
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

  const { report, comparison, growthComparison, trend, homepageUrl, hotpepperUrl, recruitmentLpUrl } = body;
  if (!report || !comparison || !growthComparison || !trend) {
    return NextResponse.json({ error: "report/comparison/growthComparison/trend は必須です" }, { status: 400 });
  }

  try {
    const result = await streamGoogleAdReportAnalysis(
      report,
      comparison,
      growthComparison,
      trend,
      homepageUrl,
      hotpepperUrl,
      recruitmentLpUrl
    );

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
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
