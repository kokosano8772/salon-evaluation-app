import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { crawlSite } from "@/lib/ai-check/crawler";
import { parseHtml } from "@/lib/ai-check/html-parser";
import { getCriteriaVersionForSiteType } from "@/lib/web-ranking/criteria-repository";
import { evaluateHpRuleItems, RankingPage } from "@/lib/web-ranking/rule-evaluators/hp";
import { generateHpRankingAnalysis } from "@/lib/web-ranking/generate-ranking-analysis";
import { aggregateCategoryScores, buildScoredItems, calculateTotalScore } from "@/lib/web-ranking/scoring";
import { EVIDENCE_EXCERPT_MAX_CHARS, AI_MAX_CHARS_PER_PAGE, AI_MAX_PAGES } from "@/lib/web-ranking/config";

export const runtime = "nodejs";
export const maxDuration = 120;

// Phase 1ではHPルーブリックのみ実装済み（設計書4.3/4.4の集客LP・採用LP評価は対象外）。
const SUPPORTED_SITE_TYPES = ["hp"];

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: webAssetId } = await params;
  const admin = createAdminClient();

  const { data: webAsset, error: assetError } = await admin
    .from("ranking_web_assets")
    .select("*")
    .eq("id", webAssetId)
    .maybeSingle();
  if (assetError || !webAsset) {
    return NextResponse.json({ error: "対象サイトが見つかりませんでした" }, { status: 404 });
  }
  if (!SUPPORTED_SITE_TYPES.includes(webAsset.site_type)) {
    return NextResponse.json({ error: `site_type=${webAsset.site_type} の診断はPhase 1では未対応です` }, { status: 400 });
  }

  const { data: salon } = await admin.from("ranking_salons").select("*").eq("id", webAsset.salon_id).maybeSingle();

  const criteria = await getCriteriaVersionForSiteType("hp");
  if (!criteria) {
    return NextResponse.json({ error: "有効な採点基準（criteria_version）が見つかりません。先にseedを投入してください" }, { status: 500 });
  }

  const crawlResult = await crawlSite(webAsset.url);
  if (!crawlResult.topPage) {
    const { data: run } = await admin
      .from("ranking_audit_runs")
      .insert({
        web_asset_id: webAssetId,
        criteria_version_id: criteria.version.id,
        status: "failed",
        crawl_error: crawlResult.topPageError ?? "サイトを取得できませんでした",
        triggered_by: user.email ?? user.id,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    return NextResponse.json({ error: crawlResult.topPageError ?? "サイトを取得できませんでした", runId: run?.id }, { status: 422 });
  }

  const topPage: RankingPage = { url: crawlResult.topPage.url, html: crawlResult.topPage.html, parsed: parseHtml(crawlResult.topPage.url, crawlResult.topPage.html) };
  const otherPages: RankingPage[] = crawlResult.pages.map((p) => ({ url: p.url, html: p.html, parsed: parseHtml(p.url, p.html) }));
  const crawlWarning = crawlResult.pages.length === 0 ? "重要ページをほとんど取得できず、トップページのみで診断しています" : null;

  const ruleResults = await evaluateHpRuleItems({
    topPage,
    otherPages,
    hasSitemap: crawlResult.sitemapUrls.length > 0,
    hasRobotsTxt: !!crawlResult.robotsTxt,
    salon: {
      prefecture: salon?.prefecture ?? "",
      city: salon?.city ?? "",
      storeCount: salon?.store_count ?? null,
    },
  });

  let aiItems: Record<string, boolean> = {};
  try {
    const allPages = [topPage, ...otherPages];
    const aiResponse = await generateHpRankingAnalysis({
      url: topPage.url,
      pages: allPages.slice(0, AI_MAX_PAGES).map((p) => ({
        url: p.url,
        title: p.parsed.title,
        headings: [...p.parsed.h1, ...p.parsed.h2, ...p.parsed.h3],
        textExcerpt: p.parsed.textContent.slice(0, AI_MAX_CHARS_PER_PAGE),
      })),
    });
    aiItems = aiResponse.items;
  } catch (error) {
    // AI判定が失敗してもルールベース項目の結果は活かす（AI項目はunknown扱いになる）。
    console.error("ranking AI judge failed", error);
  }

  const scoredItems = buildScoredItems(criteria.items, ruleResults, aiItems);
  const categoryScores = aggregateCategoryScores(scoredItems);
  const { score: totalScore, maxScore: totalMaxScore } = calculateTotalScore(categoryScores);

  const { data: run, error: runError } = await admin
    .from("ranking_audit_runs")
    .insert({
      web_asset_id: webAssetId,
      criteria_version_id: criteria.version.id,
      status: "completed",
      crawl_warning: crawlWarning,
      total_score: totalScore,
      total_max_score: totalMaxScore,
      triggered_by: user.email ?? user.id,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (runError || !run) {
    return NextResponse.json({ error: runError?.message ?? "保存に失敗しました" }, { status: 500 });
  }

  const { data: scoreRows, error: scoreError } = await admin
    .from("ranking_audit_scores")
    .insert(
      scoredItems.map((item) => ({
        audit_run_id: run.id,
        criteria_item_id: item.criteriaItemId,
        score: item.score,
        max_score: item.maxScore,
        status: item.status,
      }))
    )
    .select("id, criteria_item_id");
  if (scoreError || !scoreRows) {
    return NextResponse.json({ error: scoreError?.message ?? "採点結果の保存に失敗しました", runId: run.id }, { status: 500 });
  }

  const scoreIdByItemId = new Map(scoreRows.map((r) => [r.criteria_item_id, r.id]));
  const evidenceRows = scoredItems
    .filter((item) => item.evidence && (item.evidence.excerpt || item.evidence.note || item.evidence.sourceUrl))
    .map((item) => ({
      audit_score_id: scoreIdByItemId.get(item.criteriaItemId)!,
      source_url: item.evidence?.sourceUrl ?? null,
      excerpt: (item.evidence?.excerpt ?? "").slice(0, EVIDENCE_EXCERPT_MAX_CHARS),
      note: item.evidence?.note ?? "",
    }))
    .filter((e) => !!e.audit_score_id);
  if (evidenceRows.length > 0) {
    await admin.from("ranking_audit_evidence").insert(evidenceRows);
  }

  return NextResponse.json({ runId: run.id, totalScore, totalMaxScore });
}
