// 2つのURLが「同じサイト」を指しているかを緩く判定するための正規化。
// プロトコル差（http/https）・www有無・末尾スラッシュ・大文字小文字の違いを吸収する。
// クエリ文字列やハッシュは比較対象から除外（同一サイトとみなす）。
// index.html等の末尾バリエーションまでは吸収しない（過剰最適化のため見送り）。
export function normalizeUrlForMatch(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const path = u.pathname.replace(/\/+$/, "");
    return `${host}${path}`;
  } catch {
    return null;
  }
}
