// HPルーブリックのルールベース項目判定。lib/ai-check/rule-based-scorer.tsと同じ
// 「HTML・構造・存在確認はAIに判断させずコード側で機械的に確定させる」考え方だが、
// 採点基準自体はDB（ranking_criteria_items）から取得する点が異なる
// （配点をコードに固定値として散在させないため。設計書12章）。

import * as cheerio from "cheerio";
import { ParsedPage } from "@/lib/ai-check/html-parser";
import { assertUrlIsSafeToFetch, SsrfBlockedError } from "@/lib/ai-check/ssrf-guard";
import { RankingItemStatus, SalonContext } from "../types";
import { BROKEN_LINK_SAMPLE_SIZE } from "../config";
import {
  ACCESS_KEYWORD_PATTERN,
  ADDRESS_PATTERN,
  BOOKING_KEYWORD_PATTERN,
  BUSINESS_HOURS_PATTERN,
  CLOSED_DAY_PATTERN,
  CONTACT_FORM_KEYWORD_PATTERN,
  DURATION_PATTERN,
  LINE_PATTERN,
  LOCAL_BUSINESS_JSONLD_TYPES,
  MENU_KEYWORD_PATTERN,
  MENU_PRICE_PATTERN,
  RECRUIT_KEYWORD_PATTERN,
  STAFF_KEYWORD_PATTERN,
} from "./patterns";

export interface RankingPage {
  url: string;
  html: string;
  parsed: ParsedPage;
}

export interface HpRuleEvaluationInput {
  topPage: RankingPage;
  otherPages: RankingPage[];
  hasSitemap: boolean;
  hasRobotsTxt: boolean;
  salon: SalonContext;
}

export interface RuleItemResult {
  score: number;
  status: RankingItemStatus;
  evidence?: { sourceUrl?: string; excerpt?: string; note?: string };
}

function pass(maxScore: number, evidence?: RuleItemResult["evidence"]): RuleItemResult {
  return { score: maxScore, status: "pass", evidence };
}
function fail(evidence?: RuleItemResult["evidence"]): RuleItemResult {
  return { score: 0, status: "fail", evidence };
}
function notApplicable(): RuleItemResult {
  return { score: 0, status: "not_applicable" };
}

// 1ページ構成のサイトでは、メニュー・スタイリスト等の見出しはH1ではなくH2/H3で
// 書かれるのが一般的なため、URLとH1だけでなくH2/H3も見る
// （lib/ai-check/rule-based-scorer.tsのpageMatchesKeywordと同じ考え方）。
function pageMatchesKeyword(page: RankingPage, pattern: RegExp): boolean {
  if (pattern.test(page.url)) return true;
  const { h1, h2, h3 } = page.parsed;
  return [...h1, ...h2, ...h3].some((h) => pattern.test(h));
}

function extractAnchors(html: string): { href: string; text: string }[] {
  const $ = cheerio.load(html);
  const anchors: { href: string; text: string }[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const text = $(el).text().replace(/\s+/g, " ").trim();
    anchors.push({ href, text });
  });
  return anchors;
}

async function hasWorkingInternalLinks(topPage: RankingPage): Promise<{ ok: boolean; checked: number; broken: number }> {
  const base = new URL(topPage.url);
  const anchors = extractAnchors(topPage.html);
  const candidates = Array.from(
    new Set(
      anchors
        .map((a) => {
          try {
            const abs = new URL(a.href, base);
            return abs.hostname === base.hostname ? abs.toString() : null;
          } catch {
            return null;
          }
        })
        .filter((u): u is string => !!u && u !== topPage.url)
    )
  ).slice(0, BROKEN_LINK_SAMPLE_SIZE);

  if (candidates.length === 0) return { ok: true, checked: 0, broken: 0 };

  let broken = 0;
  await Promise.all(
    candidates.map(async (url) => {
      try {
        const safeUrl = await assertUrlIsSafeToFetch(url);
        const res = await fetch(safeUrl, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(8000) });
        if (res.status >= 400) broken++;
      } catch (e) {
        if (e instanceof SsrfBlockedError) return; // 安全性チェックで弾かれたURLは対象外（壊れているとは見なさない）
        broken++;
      }
    })
  );
  return { ok: broken === 0, checked: candidates.length, broken };
}

async function checkApplyMethodOnExternalPage(href: string, baseUrl: string): Promise<RuleItemResult> {
  let absoluteUrl: string;
  try {
    absoluteUrl = new URL(href, baseUrl).toString();
  } catch {
    return fail({ note: "採用ページのURLを解決できなかった" });
  }
  try {
    const safeUrl = await assertUrlIsSafeToFetch(absoluteUrl);
    const res = await fetch(safeUrl, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(8000) });
    if (res.status >= 400) return fail({ sourceUrl: absoluteUrl, note: `採用ページの取得に失敗（HTTP ${res.status}）` });
    const html = await res.text();
    const anchors = extractAnchors(html);
    const hasApplyMethod =
      anchors.some((a) => a.href.toLowerCase().startsWith("tel:") || a.href.toLowerCase().startsWith("mailto:")) || /<form/i.test(html);
    return hasApplyMethod ? pass(3, { sourceUrl: absoluteUrl }) : fail({ sourceUrl: absoluteUrl });
  } catch (e) {
    const note = e instanceof SsrfBlockedError ? "採用ページの取得先が安全性チェックで許可されなかった" : "採用ページの取得に失敗した";
    return { score: 0, status: "unknown", evidence: { sourceUrl: absoluteUrl, note } };
  }
}

export async function evaluateHpRuleItems(input: HpRuleEvaluationInput): Promise<Record<string, RuleItemResult>> {
  const { topPage, otherPages, hasSitemap, hasRobotsTxt, salon } = input;
  const allPages = [topPage, ...otherPages];
  const allText = allPages.map((p) => p.parsed.textContent).join(" ");
  const results: Record<string, RuleItemResult> = {};

  // --- SEO・地域検索 ---
  results.seo_title_present = topPage.parsed.title ? pass(2, { excerpt: topPage.parsed.title }) : fail();
  results.seo_meta_description_present = topPage.parsed.metaDescription
    ? pass(2, { excerpt: topPage.parsed.metaDescription })
    : fail();
  results.seo_heading_structure =
    topPage.parsed.h1.length === 1 && topPage.parsed.h2.length >= 1
      ? pass(3, { excerpt: `H1: ${topPage.parsed.h1[0]}` })
      : fail({ note: `H1件数=${topPage.parsed.h1.length}, H2件数=${topPage.parsed.h2.length}` });
  results.seo_canonical_present = topPage.parsed.canonical ? pass(1, { excerpt: topPage.parsed.canonical }) : fail();
  const noindex = (topPage.parsed.robotsMeta ?? "").toLowerCase().includes("noindex");
  results.seo_noindex_absent = noindex ? fail({ note: "robots metaにnoindexが含まれる" }) : pass(2);
  results.seo_sitemap_present = hasSitemap ? pass(1) : fail();
  const hasLocalBusinessJsonLd = topPage.parsed.jsonLdTypes.some((t) => LOCAL_BUSINESS_JSONLD_TYPES.has(t));
  results.seo_structured_data_local_business = hasLocalBusinessJsonLd
    ? pass(3, { note: topPage.parsed.jsonLdTypes.join(",") })
    : fail({ note: topPage.parsed.jsonLdTypes.join(",") || "JSON-LD無し" });
  const hasAddress = ADDRESS_PATTERN.test(allText);
  results.seo_address_present = hasAddress ? pass(3) : fail();
  const regionNeedle = [salon.prefecture, salon.city].filter(Boolean);
  const titleAndH1 = `${topPage.parsed.title ?? ""} ${topPage.parsed.h1.join(" ")}`;
  const regionMatched = regionNeedle.length > 0 && regionNeedle.some((r) => titleAndH1.includes(r));
  results.seo_region_name_in_title_or_heading =
    regionNeedle.length === 0
      ? notApplicable()
      : regionMatched
        ? pass(3, { excerpt: titleAndH1.slice(0, 100) })
        : fail({ note: `登録地域「${regionNeedle.join("")}」がtitle/H1に見つからない` });

  // --- 店舗・メニュー情報 ---
  const menuPage = allPages.find((p) => pageMatchesKeyword(p, MENU_KEYWORD_PATTERN));
  const hasMenuList = !!menuPage && MENU_PRICE_PATTERN.test(menuPage.parsed.textContent);
  results.menu_list_present = hasMenuList ? pass(4, { sourceUrl: menuPage?.url }) : fail();
  const hasPriceAndDuration =
    !!menuPage && MENU_PRICE_PATTERN.test(menuPage.parsed.textContent) && DURATION_PATTERN.test(menuPage.parsed.textContent);
  results.menu_price_duration_clear = hasPriceAndDuration ? pass(3, { sourceUrl: menuPage?.url }) : fail();
  const hasHours = BUSINESS_HOURS_PATTERN.test(allText) && CLOSED_DAY_PATTERN.test(allText);
  results.business_hours_clear = hasHours ? pass(3) : fail();
  const accessPage = allPages.find((p) => pageMatchesKeyword(p, ACCESS_KEYWORD_PATTERN));
  results.access_info_present = accessPage ? pass(4, { sourceUrl: accessPage.url }) : fail();
  const staffPage = allPages.find((p) => pageMatchesKeyword(p, STAFF_KEYWORD_PATTERN));
  results.staff_intro_present = staffPage ? pass(3, { sourceUrl: staffPage.url }) : fail();
  if (salon.storeCount !== null && salon.storeCount > 1) {
    // 店舗別ページ（アクセスページとは別に、店舗名らしき見出しが複数ページに渡って
    // 存在するか）を厳密に判定するのは難しいため、Phase 1では「店舗一覧」的な
    // ページの有無で簡易判定する。
    const hasStoreListPage = allPages.some((p) => /店舗一覧|店舗情報|shop\s?list|all\s?stores/i.test(`${p.url} ${p.parsed.title ?? ""}`));
    results.multi_store_info_present = hasStoreListPage ? pass(3) : fail();
  } else {
    results.multi_store_info_present = notApplicable();
  }

  // --- サイト構造・技術品質 ---
  results.mobile_viewport_present = topPage.parsed.hasViewportMeta ? pass(3) : fail();
  results.internal_links_sufficient = topPage.parsed.internalLinkCount >= 5 ? pass(2) : fail();
  results.https_enabled = topPage.url.startsWith("https://") ? pass(2) : fail();
  results.robots_txt_present = hasRobotsTxt ? pass(1) : fail();
  const linkCheck = await hasWorkingInternalLinks(topPage);
  results.no_broken_links =
    linkCheck.checked === 0
      ? { score: 0, status: "unknown", evidence: { note: "内部リンクが見つからずチェック対象無し" } }
      : linkCheck.ok
        ? pass(2, { note: `${linkCheck.checked}件サンプルチェック、全て正常` })
        : fail({ note: `${linkCheck.checked}件中${linkCheck.broken}件が壊れている可能性` });

  // --- 集客導線・コンバージョン ---
  const anchorsByPage = allPages.map((p) => ({ page: p, anchors: extractAnchors(p.html) }));
  const telLink = anchorsByPage.flatMap((a) => a.anchors).find((a) => a.href.toLowerCase().startsWith("tel:"));
  results.tel_link_present = telLink ? pass(5, { excerpt: telLink.href }) : fail();
  const bookingAnchor = anchorsByPage
    .flatMap((a) => a.anchors)
    .find((a) => BOOKING_KEYWORD_PATTERN.test(a.text) || BOOKING_KEYWORD_PATTERN.test(a.href));
  const hasBookingFlow = !!telLink || !!bookingAnchor || BOOKING_KEYWORD_PATTERN.test(allText);
  results.booking_flow_present = hasBookingFlow ? pass(6, { excerpt: bookingAnchor?.text ?? telLink?.href }) : fail();
  const allAnchors = anchorsByPage.flatMap((a) => a.anchors);
  const hasMailto = allAnchors.some((a) => a.href.toLowerCase().startsWith("mailto:"));
  const hasLine = allAnchors.some((a) => LINE_PATTERN.test(a.href) || LINE_PATTERN.test(a.text)) || LINE_PATTERN.test(allText);
  const hasContactForm =
    allPages.some((p) => CONTACT_FORM_KEYWORD_PATTERN.test(p.parsed.textContent) && /<form/i.test(p.html));
  const channelCount = [!!telLink, hasMailto, hasLine, hasContactForm].filter(Boolean).length;
  results.contact_channel_variety =
    channelCount >= 3
      ? pass(4, { note: `${channelCount}種類の連絡手段` })
      : channelCount > 0
        ? { score: channelCount, status: "partial", evidence: { note: `${channelCount}種類の連絡手段` } }
        : fail();

  // --- 採用情報 ---
  // まず同一ホスト内でクロール済みのページから探す。見つからなければ、
  // 採用ページが別サブドメイン（例: recruit.example.com）で運用されていて
  // クローラーが同一ホスト限定でフォローしなかったケースを想定し、
  // 既にクロール済みの各ページのリンクテキスト・href自体もスキャンする
  // （実例: belin.jpの採用ページがrecruit.belin.jpという別サブドメインで、
  // トップページのフッターに「採用情報」というリンクテキストだけが存在していた）。
  const recruitPage = allPages.find((p) => pageMatchesKeyword(p, RECRUIT_KEYWORD_PATTERN));
  const recruitAnchorFromLinks = recruitPage
    ? null
    : anchorsByPage
        .flatMap((a) => a.anchors)
        .find((a) => RECRUIT_KEYWORD_PATTERN.test(a.text) || RECRUIT_KEYWORD_PATTERN.test(a.href));

  if (recruitPage) {
    results.recruit_page_linked = pass(4, { sourceUrl: recruitPage.url });
  } else if (recruitAnchorFromLinks) {
    try {
      const absoluteUrl = new URL(recruitAnchorFromLinks.href, topPage.url).toString();
      results.recruit_page_linked = pass(4, { sourceUrl: absoluteUrl, note: `リンクテキスト「${recruitAnchorFromLinks.text}」` });
    } catch {
      results.recruit_page_linked = pass(4, { note: `リンクテキスト「${recruitAnchorFromLinks.text}」` });
    }
  } else {
    results.recruit_page_linked = fail();
  }

  if (recruitPage) {
    const recruitAnchors = extractAnchors(recruitPage.html);
    const hasApplyMethod =
      recruitAnchors.some((a) => a.href.toLowerCase().startsWith("tel:") || a.href.toLowerCase().startsWith("mailto:")) ||
      /<form/i.test(recruitPage.html);
    results.recruit_apply_method_clear = hasApplyMethod ? pass(3, { sourceUrl: recruitPage.url }) : fail({ sourceUrl: recruitPage.url });
  } else if (recruitAnchorFromLinks) {
    // 別サブドメイン等、クロール対象外だったページを応募方法の確認のためだけに
    // 単発で安全に取得する（SSRFガードは通す。クローラー本体の同一ホスト限定
    // ポリシーとは別の、この1項目専用の軽い追加フェッチ）。
    results.recruit_apply_method_clear = await checkApplyMethodOnExternalPage(recruitAnchorFromLinks.href, topPage.url);
  } else {
    results.recruit_apply_method_clear = fail({ note: "採用ページが見つからない" });
  }

  return results;
}
