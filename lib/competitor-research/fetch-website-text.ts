// 競合のウェブサイトを取得し、Geminiに読ませるためのプレーンテキストに変換する。
// JSでレンダリングされるサイトは初期HTMLに本文が無く抽出できない場合がある（既知の制約）。

const MAX_CHARS = 6000;
const FETCH_TIMEOUT_MS = 8000;

export async function fetchWebsiteText(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SalonValueScoreBot/1.0)" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();

    if (text.length < 50) return null;
    return text.slice(0, MAX_CHARS);
  } catch {
    return null;
  }
}
