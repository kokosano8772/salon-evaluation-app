import * as cheerio from "cheerio";

export interface ParsedPage {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string[];
  h2: string[];
  h3: string[];
  canonical: string | null;
  robotsMeta: string | null;
  hasViewportMeta: boolean;
  // WordPress等のCMSは、ブログ・お知らせ欄のURLが「/blog/」のような分かりやすい命名で
  // あるとは限らない（「/topics/」等、サイトごとに自由な命名のことが多い）が、
  // <head>のRSSフィード自動検出リンクはCMSが標準で出力するため、命名に依存せず
  // ブログ機能の有無を判定できる（実例: casica.powder-group.comで確認）。
  hasFeedLink: boolean;
  jsonLdTypes: string[];
  jsonLd: unknown[];
  imageAltTexts: string[];
  internalLinkCount: number;
  externalLinkCount: number;
  textContent: string; // AI分析用に渡す本文（タグを除いたプレーンテキスト、長すぎる場合は呼び出し側で切り詰める）
}

function collectJsonLdTypes(data: unknown, acc: string[]): void {
  if (Array.isArray(data)) {
    data.forEach((item) => collectJsonLdTypes(item, acc));
    return;
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj["@type"] === "string") acc.push(obj["@type"]);
    if (Array.isArray(obj["@type"])) acc.push(...obj["@type"].filter((t): t is string => typeof t === "string"));
    if (Array.isArray(obj["@graph"])) collectJsonLdTypes(obj["@graph"], acc);
  }
}

export function parseHtml(url: string, html: string): ParsedPage {
  const $ = cheerio.load(html);
  const baseUrl = new URL(url);

  const h1 = $("h1").map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const h2 = $("h2").map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const h3 = $("h3").map((_, el) => $(el).text().trim()).get().filter(Boolean);
  const imageAltTexts = $("img[alt]").map((_, el) => $(el).attr("alt")?.trim() ?? "").get().filter(Boolean);

  const jsonLd: unknown[] = [];
  const jsonLdTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    try {
      const parsed = JSON.parse(raw);
      jsonLd.push(parsed);
      collectJsonLdTypes(parsed, jsonLdTypes);
    } catch {
      // 不正なJSON-LDはスキップ（構造化データ「あり」とは数えない）
    }
  });

  let internalLinkCount = 0;
  let externalLinkCount = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#")) return;
    try {
      const abs = new URL(href, baseUrl);
      if (abs.hostname === baseUrl.hostname) internalLinkCount++;
      else externalLinkCount++;
    } catch {
      // 不正なhrefは無視
    }
  });

  // 本文テキスト（AI分析用）。script/styleは除外し、空白を圧縮する。
  $("script, style, noscript").remove();
  const textContent = $("body").text().replace(/\s+/g, " ").trim();

  return {
    url,
    title: $("title").first().text().trim() || null,
    metaDescription: $('meta[name="description"]').attr("content")?.trim() || null,
    h1,
    h2,
    h3,
    canonical: $('link[rel="canonical"]').attr("href") || null,
    robotsMeta: $('meta[name="robots"]').attr("content") || null,
    hasViewportMeta: /width\s*=\s*device-width/i.test($('meta[name="viewport"]').attr("content") ?? ""),
    hasFeedLink: $('link[rel="alternate"][type="application/rss+xml"], link[rel="alternate"][type="application/atom+xml"]').length > 0,
    jsonLdTypes,
    jsonLd,
    imageAltTexts,
    internalLinkCount,
    externalLinkCount,
    textContent,
  };
}
