import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteDataForPrompt } from "@/lib/ai-check/build-ai-check-prompt";
import { generateAiCheckAnalysis } from "@/lib/ai/generateAiCheckAnalysis";
import { aggregateCategoryScores, applyQuizAnswers, calculateTotalScore } from "@/lib/ai-check/scoring";
import { calculateAiCheckRank, DiagnosisItem } from "@/lib/ai-check/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// プロ版はここで初めてGeminiを呼ぶ（1診断あたり1回）。クロール自体の濫用防止用レート
// リミットとは別に、AIコストが発生するこのエンドポイント専用の厳しめの上限をかける。
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1時間

interface ProFinalizeBody {
  url: string;
  ruleItems: DiagnosisItem[];
  crawlWarning: string | null;
  siteDataForPrompt: SiteDataForPrompt;
  quizAnswers: Record<string, number>;
}

export async function POST(request: Request) {
  let body: ProFinalizeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (!body.url || !Array.isArray(body.ruleItems) || !body.siteDataForPrompt || typeof body.quizAnswers !== "object") {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (clientIp !== "unknown") {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count, error: countError } = await admin
      .from("ai_check_diagnoses")
      .select("id", { count: "exact", head: true })
      .eq("client_ip", clientIp)
      .eq("tier", "pro")
      .gte("created_at", since);
    if (!countError && (count ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json({ error: "プロ版の診断回数の上限に達しました。しばらく時間をおいて再度お試しください。" }, { status: 429 });
    }
  }

  const quizItems = applyQuizAnswers(body.quizAnswers);
  const allItems = [...body.ruleItems, ...quizItems];
  const categoryScores = aggregateCategoryScores(allItems);
  const totalScore = calculateTotalScore(categoryScores);
  const rank = calculateAiCheckRank(totalScore);

  let aiResponse: Awaited<ReturnType<typeof generateAiCheckAnalysis>>;
  try {
    aiResponse = await generateAiCheckAnalysis(body.siteDataForPrompt, totalScore, categoryScores, allItems);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI分析に失敗しました";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const { data, error: insertError } = await admin
    .from("ai_check_diagnoses")
    .insert({
      url: body.url,
      tier: "pro",
      total_score: totalScore,
      score_max: 100,
      rank,
      summary: aiResponse.summary,
      target: aiResponse.target,
      strengths: aiResponse.strengths,
      weaknesses: aiResponse.weaknesses,
      missing_information: aiResponse.missingInformation,
      recommendations: aiResponse.recommendations,
      category_scores: categoryScores,
      diagnosis_items: allItems,
      manual_answers: body.quizAnswers,
      crawl_warning: body.crawlWarning,
      client_ip: clientIp,
    })
    .select("id")
    .single();

  if (insertError || !data) {
    return NextResponse.json({ error: insertError?.message ?? "保存に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, tier: "pro" });
}
