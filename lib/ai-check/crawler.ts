import { assertUrlIsSafeToFetch, SsrfBlockedError } from "./ssrf-guard";

const MAX_REDIRECTS = 5;
const PAGE_TIMEOUT_MS = 10_000;
const MAX_PAGE_BYTES = 2_000_000; // 1ページ最大2MB（HTMLとしては十分すぎる上限）
const MAX_PAGES = 30;
const OVERALL_TIMEOUT_MS = 90_000;

export interface FetchedPage {
  url: string;
  statusCode: number;
  html: string;
}

export interface CrawlResult {
  topPage: FetchedPage | null;
  // トップページ自体が取得できなかった場合のエラー理由（UIで「確認できませんでした」と表示するため）
  topPageError: string | null;
  pages: FetchedPage[]; // トップページ以外の重要ページ（最大29件）
  robotsTxt: string | null;
  sitemapUrls: string[];
}

// 安全なfetch。リダイレクトは自動追従させず、1hopごとにSSRF検証をかけ直す。
async function safeFetch(rawUrl: string): Promise<FetchedPage> {
  let currentUrl = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertUrlIsSafeToFetch(currentUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SalonAICheckBot/1.0)" },
      });

      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get("location");
        if (!location) throw new Error("リダイレクト先が不明です");
        currentUrl = new URL(location, url).toString();
        continue;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        return { url: url.toString(), statusCode: res.status, html: await res.text() };
      }
      let received = 0;
      const chunks: Uint8Array[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
        if (received > MAX_PAGE_BYTES) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
      const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
      return { url: url.toString(), statusCode: res.status, html };
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("リダイレクトが多すぎます");
}

// robots.txt/sitemap.xmlはベストエフォート（無くても診断自体は続行する）
async function safeFetchTextOrNull(rawUrl: string): Promise<string | null> {
  try {
    const page = await safeFetch(rawUrl);
    return page.statusCode >= 200 && page.statusCode < 300 ? page.html : null;
  } catch {
    return null;
  }
}

function extractSitemapUrls(sitemapXml: string): string[] {
  const matches = sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g);
  return Array.from(matches, (m) => m[1].trim());
}

// robots.txtの「User-agent: *」グループのDisallowパスを尊重する（行儀の良いクローラーの最低限の作法）。
// 厳密なrobots.txtパーサーではないが、Disallow行の前方一致判定という最も基本的な挙動はカバーする。
function parseDisallowedPaths(robotsTxt: string): string[] {
  const lines = robotsTxt.split("\n").map((l) => l.trim());
  const disallowed: string[] = [];
  let inWildcardGroup = false;
  for (const line of lines) {
    const uaMatch = line.match(/^user-agent:\s*(.+)$/i);
    if (uaMatch) {
      inWildcardGroup = uaMatch[1].trim() === "*";
      continue;
    }
    if (!inWildcardGroup) continue;
    const disallowMatch = line.match(/^disallow:\s*(.*)$/i);
    if (disallowMatch && disallowMatch[1].trim()) disallowed.push(disallowMatch[1].trim());
  }
  return disallowed;
}

function isPathDisallowed(url: string, disallowedPaths: string[]): boolean {
  const path = new URL(url).pathname;
  return disallowedPaths.some((p) => path.startsWith(p));
}

// サイトマップインデックス内の子サイトマップURL（post-sitemap.xml等）を、HTMLページ
// だと誤認してクロール対象に含めないための判定。通常のページURLが.xmlで終わることは
// 実質無いため、この拡張子だけで十分判別できる。
function isXmlUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".xml");
  } catch {
    return false;
  }
}

// 重要ページ判定のキーワード（設計書6章準拠）。URLパス・リンクテキストどちらかに
// 含まれていれば優先的にクロール対象にする。
const IMPORTANT_KEYWORDS = [
  "menu", "メニュー",
  "staff", "スタッフ",
  "about", "店舗情報", "会社概要",
  "access", "アクセス",
  "blog", "ブログ",
  "faq", "よくある質問",
  "voice", "review", "口コミ",
  "style", "ヘアスタイル", "スタイル",
  "case", "事例", "お客様の声",
  "髪質改善",
  "color", "カラー",
  "perm", "パーマ",
  "縮毛矯正",
  "白髪",
  "recruit", "採用", "求人",
];

function scoreUrlImportance(href: string, linkText: string): number {
  const haystack = `${href} ${linkText}`.toLowerCase();
  return IMPORTANT_KEYWORDS.filter((kw) => haystack.includes(kw.toLowerCase())).length;
}

interface LinkCandidate {
  url: string;
  score: number;
}

function extractInternalLinks(html: string, baseUrl: URL): LinkCandidate[] {
  const candidates = new Map<string, number>();
  // 簡易的な正規表現抽出（この時点ではcheerio未導入でもリンク発見はできるようにしておく。
  // 本文の詳細な構造解析はhtml-parser.ts側でcheerioを使う）
  const anchorRegex = /<a\s+[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(html))) {
    const [, href, innerHtml] = match;
    let absolute: URL;
    try {
      absolute = new URL(href, baseUrl);
    } catch {
      continue;
    }
    if (absolute.hostname !== baseUrl.hostname) continue;
    if (!["http:", "https:"].includes(absolute.protocol)) continue;
    absolute.hash = "";
    const key = absolute.toString();
    const linkText = innerHtml.replace(/<[^>]+>/g, " ");
    const score = scoreUrlImportance(href, linkText);
    candidates.set(key, Math.max(candidates.get(key) ?? 0, score));
  }
  return Array.from(candidates, ([url, score]) => ({ url, score }));
}

export async function crawlSite(startUrl: string): Promise<CrawlResult> {
  const deadline = Date.now() + OVERALL_TIMEOUT_MS;

  let topPage: FetchedPage;
  try {
    topPage = await safeFetch(startUrl);
  } catch (error) {
    const message =
      error instanceof SsrfBlockedError
        ? error.message
        : error instanceof Error
          ? `サイトを取得できませんでした（${error.message}）`
          : "サイトを取得できませんでした";
    return { topPage: null, topPageError: message, pages: [], robotsTxt: null, sitemapUrls: [] };
  }

  const baseUrl = new URL(topPage.url);
  const [robotsTxt, sitemapXml] = await Promise.all([
    safeFetchTextOrNull(new URL("/robots.txt", baseUrl).toString()),
    safeFetchTextOrNull(new URL("/sitemap.xml", baseUrl).toString()),
  ]);
  const sitemapUrls = sitemapXml ? extractSitemapUrls(sitemapXml) : [];

  const linkCandidates = extractInternalLinks(topPage.html, baseUrl).filter((c) => !isXmlUrl(c.url));
  // サイトマップ由来のURLも候補に加える（スコアは0=低優先度扱い。キーワード一致があれば加点）。
  // WordPress等では/sitemap.xmlがページ一覧ではなく「post-sitemap.xml」等の子サイトマップへの
  // 索引（サイトマップインデックス）になっていることが多く、その<loc>をそのままページ候補として
  // 扱うと、HTMLページではなくXMLファイル自体をコンテンツとしてクロール・AIに渡してしまう
  // （実際にbelin.jpで発生し、本文と無関係なノイズとしてAIに渡っていた）。.xmlで終わるURLは
  // ページ候補から除外する。
  for (const loc of sitemapUrls) {
    if (isXmlUrl(loc)) continue;
    try {
      const u = new URL(loc);
      if (u.hostname !== baseUrl.hostname) continue;
      const score = scoreUrlImportance(loc, "");
      if (!linkCandidates.some((c) => c.url === u.toString())) {
        linkCandidates.push({ url: u.toString(), score });
      }
    } catch {
      // 不正なURLはスキップ
    }
  }

  const disallowedPaths = robotsTxt ? parseDisallowedPaths(robotsTxt) : [];

  // スコアの高い順（同点ならそのまま）に、トップページとrobots.txtで禁止されたパスを除いて
  // 最大29件に絞る
  const sorted = linkCandidates
    .filter((c) => c.url !== topPage.url)
    .filter((c) => !isPathDisallowed(c.url, disallowedPaths))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PAGES - 1);

  const pages: FetchedPage[] = [];
  for (const candidate of sorted) {
    if (Date.now() > deadline) break;
    try {
      const page = await safeFetch(candidate.url);
      if (page.statusCode >= 200 && page.statusCode < 300) pages.push(page);
    } catch {
      // 個別ページの失敗は無視して続行（サイト全体の診断は継続する）
    }
  }

  return { topPage, topPageError: null, pages, robotsTxt, sitemapUrls };
}
