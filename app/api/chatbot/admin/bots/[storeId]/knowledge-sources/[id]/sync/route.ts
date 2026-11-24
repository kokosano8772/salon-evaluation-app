import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertUrlIsSafeToFetch, SsrfBlockedError } from "@/lib/ai-check/ssrf-guard";
import { structureKnowledgeSourceContent } from "@/lib/ai/structureKnowledgeSourceContent";

export const runtime = "nodejs";
export const maxDuration = 30;

const FETCH_TIMEOUT_MS = 10_000;
const MAX_PAGE_BYTES = 2_000_000;
const MAX_CONTENT_CHARS = 20_000;
// これ未満しか本文を取得できなかった場合は、何らかの理由でうまく読み込めて
// いない可能性が高いとみなして警告する（実在するLPで試した所、普通に書かれた
// 求人LP1枚で1万文字超が取得できたため、数百文字程度では明らかに少なすぎる）。
const MIN_CONTENT_LENGTH_WITHOUT_WARNING = 300;

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

// 取得できた文字数が極端に少ない場合に、スタッフが気づけるよう警告文を作る。
// このアプリの取得方式はJavaScriptを実行しない（素のHTMLを読むだけ）ため、
// JavaScriptで後から中身を描画するタイプのサイト（React/Vue等のSPA）だと、
// 取得したHTMLにナビ・フッターなどの殻しか入っておらず、本文がほぼ空のまま
// 取り込まれてしまうことがある。気づかずそのまま承認してしまうと、AIがその
// ページの内容を一切使えないまま「承認済み」に見えてしまうため、ここで検知する。
function buildFetchWarning(rawHtml: string, text: string): string {
  if (text.length >= MIN_CONTENT_LENGTH_WITHOUT_WARNING) return "";
  const looksLikeJsRenderedShell =
    /id=["'](root|__next|app)["']/.test(rawHtml) || rawHtml.includes("__NEXT_DATA__") || rawHtml.includes("__NUXT__");
  if (looksLikeJsRenderedShell) {
    return (
      "取得できた文字数が少なく（" +
      text.length +
      "文字）、うまく読み込めていない可能性があります。JavaScriptで表示を組み立てるタイプのサイトは、" +
      "この取り込み機能では中身を正しく読み取れないことがあります。実際のページを開いて、内容が十分に反映されているか目視で確認してください。"
    );
  }
  return (
    "取得できた文字数が少ないです（" +
    text.length +
    "文字）。うまく読み込めていない可能性があるので、実際のページを開いて内容を目視で確認してください。"
  );
}

// 既存のURL診断（lib/ai-check/ssrf-guard.ts）と同じSSRF対策を流用する:
// http/httpsのみ許可、DNS解決先がprivate/loopback等でないことを確認、
// リダイレクトは自動追従させず1hopごとに再検証する。
async function fetchPlainText(rawUrl: string): Promise<{ text: string; warning: string }> {
  let currentUrl = rawUrl;
  for (let hop = 0; hop <= 5; hop++) {
    const url = await assertUrlIsSafeToFetch(currentUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SalonChatbotKnowledgeBot/1.0)" },
      });
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get("location");
        if (!location) throw new Error("リダイレクト先が不明です");
        currentUrl = new URL(location, url).toString();
        continue;
      }
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`取得に失敗しました（status ${res.status}）`);
      }
      const reader = res.body?.getReader();
      let html: string;
      if (!reader) {
        html = await res.text();
      } else {
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
        html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
      }
      const $ = cheerio.load(html);
      $("script, style, noscript").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, MAX_CONTENT_CHARS);
      return { text, warning: buildFetchWarning(html, text) };
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("リダイレクトが多すぎます");
}

export async function POST(_request: Request, { params }: { params: Promise<{ storeId: string; id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: source, error: sourceError } = await admin
    .from("chatbot_knowledge_sources")
    .select("url, approved_content_hash")
    .eq("id", id)
    .maybeSingle();
  if (sourceError || !source) {
    return NextResponse.json({ error: "取得元が見つかりませんでした" }, { status: 404 });
  }
  if (!source.url) {
    return NextResponse.json({ error: "URLが設定されていません" }, { status: 400 });
  }

  let text: string;
  let fetchWarning: string;
  try {
    ({ text, warning: fetchWarning } = await fetchPlainText(source.url));
  } catch (error) {
    const message =
      error instanceof SsrfBlockedError
        ? error.message
        : error instanceof Error
          ? error.message
          : "取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // staleness判定は生スクレイピング結果のハッシュで行う（ページの中身が変わったかどうかの
  // 判定に使うため）。Geminiの整理後テキストは呼び出すたびに言い回しが変わり得る（非決定的）
  // ので、ハッシュに使うと中身が同じでも毎回staleになってしまい判定が意味をなさなくなる。
  const hash = hashContent(text);
  // 承認済みの内容と違いがある場合はstale（再確認待ち）にし、承認済みの内容は
  // approved_content側に残したまま変更しない（再承認するまで公開情報は変わらない）。
  const status = source.approved_content_hash && source.approved_content_hash !== hash ? "stale" : "fetched";

  // 生テキストはナビ・フッター等が混ざって読みにくいため、管理者が確認しやすいよう
  // Geminiで求人情報として整理する。無料枠のレート制限等で失敗した場合は、確認作業が
  // できなくなるのを避けるため整理前の生テキストにフォールバックする。
  let fetchedContent = text;
  try {
    fetchedContent = await structureKnowledgeSourceContent(text);
  } catch (error) {
    console.error("[knowledge-sources/sync] structuring failed, falling back to raw text:", error);
  }

  const { error } = await admin
    .from("chatbot_knowledge_sources")
    .update({
      fetched_content: fetchedContent,
      fetched_content_hash: hash,
      fetched_at: new Date().toISOString(),
      status,
      fetch_warning: fetchWarning,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, status, contentLength: fetchedContent.length, warning: fetchWarning });
}
