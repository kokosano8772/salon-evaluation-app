import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crawlSite } from "@/lib/ai-check/crawler";
import { parseHtml } from "@/lib/ai-check/html-parser";
import { scoreWithRules } from "@/lib/ai-check/rule-based-scorer";
import { SiteDataForPrompt } from "@/lib/ai-check/build-ai-check-prompt";
import { aggregateCategoryScores, calculateTotalScore } from "@/lib/ai-check/scoring";
import { calculateAiCheckRank, GoogleReviewsManualInput } from "@/lib/ai-check/types";

export const runtime = "nodejs";
export const maxDuration = 120;

// クロール自体の濫用防止用（AIコストは発生しないため緩め。プロ版の確定処理
// （Gemini呼び出しを伴う）はpro-finalize側で別途厳しいレートリミットをかける）。
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1時間

interface DiagnoseRequestBody {
  url: string;
  tier: "simple" | "pro";
  googleReviews?: GoogleReviewsManualInput;
}

// AIに渡すページ数・1ページあたりの文字数を絞り、プロンプトが肥大化しすぎないようにする。
// 1500文字だと、1ページに全セクション（コンセプト/メニュー/スタイリスト紹介等）を
// 詰め込む一枚ページ構成のサロンサイトで、スタイリスト紹介やお客様の声が本文の後半
// （1500文字より後）にあるため丸ごと切れてしまい、AI判定が実態と異なる「無い」判定に
// なる事例が見つかった（belin.jpで検証）。gemini-2.5-flashは1Mトークンのコンテキスト
// を持つため、この程度の増量はコスト・性能上問題にならない。
const AI_MAX_PAGES = 15;
const AI_MAX_CHARS_PER_PAGE = 8000;

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
  if (body.tier !== "simple" && body.tier !== "pro") {
    return NextResponse.json({ error: "tierは simple または pro である必要があります" }, { status: 400 });
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

  const crawlWarning = crawlResult.pages.length === 0 ? "重要ページをほとんど取得できず、トップページのみで診断しています" : null;

  if (body.tier === "simple") {
    // 簡易版: ルールベースのみ。Geminiは一切呼ばない。
    const categoryScores = aggregateCategoryScores(ruleItems);
    const totalScore = calculateTotalScore(categoryScores);
    const scoreMax = ruleItems.reduce((sum, i) => sum + i.maxScore, 0);

    const { data, error: insertError } = await admin
      .from("ai_check_diagnoses")
      .insert({
        url: crawlResult.topPage.url,
        tier: "simple",
        total_score: totalScore,
        score_max: scoreMax,
        rank: null,
        summary: "",
        target: "",
        strengths: [],
        weaknesses: [],
        missing_information: [],
        recommendations: [],
        category_scores: categoryScores,
        diagnosis_items: ruleItems,
        crawl_warning: crawlWarning,
        client_ip: clientIp,
      })
      .select("id")
      .single();

    if (insertError || !data) {
      return NextResponse.json({ error: insertError?.message ?? "保存に失敗しました" }, { status: 500 });
    }
    return NextResponse.json({ id: data.id, tier: "simple" });
  }

  // プロ版: ここではまだ保存しない。クイズ回答と合わせてpro-finalizeで確定させる
  // （Geminiはそちらで1回だけ呼ぶ）。
  const siteDataForPrompt: SiteDataForPrompt = {
    url: crawlResult.topPage.url,
    pages: allParsedPages.slice(0, AI_MAX_PAGES).map((p) => ({
      url: p.url,
      title: p.title,
      headings: [...p.h1, ...p.h2, ...p.h3],
      textExcerpt: p.textContent.slice(0, AI_MAX_CHARS_PER_PAGE),
    })),
  };

  return NextResponse.json({
    tier: "pro",
    url: crawlResult.topPage.url,
    ruleItems,
    crawlWarning,
    siteDataForPrompt,
  });
}
