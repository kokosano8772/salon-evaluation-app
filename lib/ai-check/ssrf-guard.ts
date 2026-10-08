// URL診断機能は、ユーザーが入力した任意のURLに対してサーバー自身がHTTPリクエストを
// 送る（これまでこのアプリには無かった処理）。これはSSRF（サーバーに社内ネットワークや
// クラウドのメタデータエンドポイント等へアクセスさせる攻撃）の典型的な攻撃面になるため、
// 「http/httpsのみ許可」「DNS解決先がprivate/loopback/link-local等でないことを確認」
// 「リダイレクトは自動追従させず、1hopごとに再検証」を徹底する。
// この3点を満たさない限り、crawler.ts側は一切fetchしてはいけない。

import dns from "node:dns/promises";

export class SsrfBlockedError extends Error {}

function ipv4ToLong(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function inRange(ip: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToLong(ip) & mask) === (ipv4ToLong(base) & mask);
}

// プライベート/ループバック/リンクローカル/CGNAT/マルチキャスト/予約済み/
// クラウドのメタデータエンドポイント(169.254.169.254はリンクローカルに含まれる)
const IPV4_BLOCKED_RANGES: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

function isBlockedIpv4(ip: string): boolean {
  return IPV4_BLOCKED_RANGES.some(([base, bits]) => inRange(ip, base, bits));
}

function isBlockedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true; // loopback
  if (lower === "::") return true;
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // fe80::/10 link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7 unique local
  // IPv4-mapped (::ffff:a.b.c.d) は埋め込まれたIPv4側も確認する
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIpv4(mapped[1]);
  return false;
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

// 渡されたURLが安全にfetch可能か検証する。安全でなければ例外を投げる。
// リダイレクトを手動で1hopずつ辿る設計のため、crawler.ts側は各hopでこの関数を
// 必ず呼び直すこと（最初の1回だけ検証して終わりにしない）。
export async function assertUrlIsSafeToFetch(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError("URLの形式が正しくありません");
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new SsrfBlockedError(`許可されていないプロトコルです: ${url.protocol}`);
  }

  // URL.hostnameはIPv6リテラルの場合「[::1]」のように角括弧付きで返る（WHATWG仕様）ため、
  // 判定前に取り除く。取り除かないと"::1"との完全一致チェックが素通りしてしまう。
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  // IPアドレスを直接指定している場合は、そのIP自体を判定する
  const isLiteralIp = /^[\d.]+$/.test(hostname) || hostname.includes(":");

  let addresses: { address: string; family: number }[];
  if (isLiteralIp) {
    addresses = [{ address: hostname, family: hostname.includes(":") ? 6 : 4 }];
  } else {
    try {
      addresses = await dns.lookup(hostname, { all: true });
    } catch {
      throw new SsrfBlockedError(`ドメイン名を解決できませんでした: ${hostname}`);
    }
  }

  for (const { address, family } of addresses) {
    const blocked = family === 4 ? isBlockedIpv4(address) : isBlockedIpv6(address);
    if (blocked) {
      throw new SsrfBlockedError(`アクセスが許可されていないアドレスです: ${address}`);
    }
  }

  return url;
}
