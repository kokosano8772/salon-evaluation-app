import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crawlSite } from "@/lib/ai-check/crawler";
import { parseHtml } from "@/lib/ai-check/html-parser";
import { scoreWithRules } from "@/lib/ai-check/rule-based-scorer";
import { generateAiCheckAnalysis } from "@/lib/ai/generateAiCheckAnalysis";
import { SiteDataForPrompt } from "@/lib/ai-check/build-ai-check-prompt";
import { buildAiJudgedDiagnosisItems, aggregateCategoryScores, calculateTotalScore } from "@/lib/ai-check/scoring";
import { calculateAiCheckRank, GoogleReviewsManualInput } from "@/lib/ai-check/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1時間

interface DiagnoseRequestBody {
  url: string;
  googleReviews?: GoogleReviewsManualInput;
}

// AIに渡すページ数・1ページあたりの文字数を絞り、プロンプトが肥大化しすぎないようにする。
// スコアリング自体（ルールベース・AI判定の対象ページ数カウント等）には影響しない。
const AI_MAX_PAGES = 15;
const AI_MAX_CHARS_PER_PAGE = 1500;

export async function POST(request: Request) {
  let body: DiagnoseRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ error: "urlは必須です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (clientIp !== "unknown") {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count, error: countError } = await admin
      .from("ai_check_diagnoses")
      .select("id", { count: "exact", head: true })
      .eq("client_ip", clientIp)
      .gte("created_at", since);
    if (!countError && (count ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json({ error: "診断回数の上限に達しました。しばらく時間をおいて再度お試しください。" }, { status: 429 });
    }
  }

  const crawlResult = await crawlSite(body.url);
  if (!crawlResult.topPage) {
    return NextResponse.json(
      { error: crawlResult.topPageError ?? "サイトを取得できませんでした" },
      { status: 422 }
    );
  }

  const parsedTopPage = parseHtml(crawlResult.topPage.url, crawlResult.topPage.html);
  const parsedOtherPages = crawlResult.pages.map((p) => parseHtml(p.url, p.html));
  const allParsedPages = [parsedTopPage, ...parsedOtherPages];

  const ruleItems = scoreWithRules({
    topPage: parsedTopPage,
    otherPages: parsedOtherPages,
    hasSitemap: crawlResult.sitemapUrls.length > 0,
    hasRobotsTxt: !!crawlResult.robotsTxt,
    googleReviews: body.googleReviews ?? null,
  });

  const siteDataForPrompt: SiteDataForPrompt = {
    url: crawlResult.topPage.url,
    pages: allParsedPages.slice(0, AI_MAX_PAGES).map((p) => ({
      url: p.url,
      title: p.title,
      headings: [...p.h1, ...p.h2, ...p.h3],
      textExcerpt: p.textContent.slice(0, AI_MAX_CHARS_PER_PAGE),
    })),
  };

  let aiItems: ReturnType<typeof buildAiJudgedDiagnosisItems>;
  let aiResponse: Awaited<ReturnType<typeof generateAiCheckAnalysis>>;
  try {
    aiResponse = await generateAiCheckAnalysis(siteDataForPrompt);
    aiItems = buildAiJudgedDiagnosisItems(aiResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI分析に失敗しました";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const allItems = [...ruleItems, ...aiItems];
  const categoryScores = aggregateCategoryScores(allItems);
  const totalScore = calculateTotalScore(categoryScores);
  const rank = calculateAiCheckRank(totalScore);

  const { data, error: insertError } = await admin
    .from("ai_check_diagnoses")
    .insert({
      url: crawlResult.topPage.url,
      total_score: totalScore,
      rank,
      summary: aiResponse.summary,
      target: aiResponse.target,
      strengths: aiResponse.strengths,
      weaknesses: aiResponse.weaknesses,
      missing_information: aiResponse.missingInformation,
      recommendations: aiResponse.recommendations,
      category_scores: categoryScores,
      diagnosis_items: allItems,
      crawl_warning: crawlResult.pages.length === 0 ? "重要ページをほとんど取得できず、トップページのみで診断しています" : null,
      client_ip: clientIp,
    })
    .select("id")
    .single();

  if (insertError || !data) {
    return NextResponse.json({ error: insertError?.message ?? "保存に失敗しました" }, { status: 500 });
  }

  // 診断履歴（ブラウザのlocalStorage）に即時追加できるよう、一覧表示に必要な値も返す
  return NextResponse.json({ id: data.id, url: crawlResult.topPage.url, totalScore, rank });
}
