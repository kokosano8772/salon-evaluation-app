import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertUrlIsSafeToFetch, SsrfBlockedError } from "@/lib/ai-check/ssrf-guard";

export const runtime = "nodejs";
export const maxDuration = 30;

const FETCH_TIMEOUT_MS = 10_000;
const MAX_PAGE_BYTES = 2_000_000;
const MAX_CONTENT_CHARS = 20_000;

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

// 既存のURL診断（lib/ai-check/ssrf-guard.ts）と同じSSRF対策を流用する:
// http/httpsのみ許可、DNS解決先がprivate/loopback等でないことを確認、
// リダイレクトは自動追従させず1hopごとに再検証する。
async function fetchPlainText(rawUrl: string): Promise<string> {
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
      const text = $("body").text().replace(/\s+/g, " ").trim();
      return text.slice(0, MAX_CONTENT_CHARS);
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
  try {
    text = await fetchPlainText(source.url);
  } catch (error) {
    const message =
      error instanceof SsrfBlockedError
        ? error.message
        : error instanceof Error
          ? error.message
          : "取得に失敗しました";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const hash = hashContent(text);
  // 承認済みの内容と違いがある場合はstale（再確認待ち）にし、承認済みの内容は
  // approved_content側に残したまま変更しない（再承認するまで公開情報は変わらない）。
  const status = source.approved_content_hash && source.approved_content_hash !== hash ? "stale" : "fetched";

  const { error } = await admin
    .from("chatbot_knowledge_sources")
    .update({
      fetched_content: text,
      fetched_content_hash: hash,
      fetched_at: new Date().toISOString(),
      status,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, status, contentLength: text.length });
}
