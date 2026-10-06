import { createAdminClient } from "@/lib/supabase/admin";

// Metaのシステムユーザートークンは最長60日で失効するため、DB(api_tokens)に保存し、
// 期限が近づいたらMetaの延長APIで自動更新する。環境変数(META_ACCESS_TOKEN)は
// 実行中のプロセスから書き換えられないため、DB保存に切り替えている。
const GRAPH_API_VERSION = "v25.0";
const PROVIDER = "meta";
// この日数を切ったら更新する。Cronの実行頻度（毎日想定）より十分大きい余裕を持たせる。
const REFRESH_THRESHOLD_DAYS = 10;

async function getStoredToken(): Promise<{ accessToken: string; expiresAt: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("api_tokens")
    .select("access_token, expires_at")
    .eq("provider", PROVIDER)
    .maybeSingle();
  if (error) throw new Error(`Metaアクセストークンの取得に失敗しました: ${error.message}`);
  if (!data) throw new Error("Metaアクセストークンが未登録です。先にapi_tokensテーブルへ初期トークンを登録してください。");
  return { accessToken: data.access_token, expiresAt: data.expires_at };
}

export async function getMetaAccessToken(): Promise<string> {
  const { accessToken } = await getStoredToken();
  return accessToken;
}

interface RefreshResult {
  refreshed: boolean;
  expiresAt: string;
}

// 期限が近ければMetaのoauth/access_tokenエンドポイントで延長し、DBを更新する。
// まだ余裕があれば何もしない（refreshed: false）。
export async function refreshMetaTokenIfNeeded(): Promise<RefreshResult> {
  const { accessToken, expiresAt } = await getStoredToken();

  const daysUntilExpiry = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (daysUntilExpiry > REFRESH_THRESHOLD_DAYS) {
    return { refreshed: false, expiresAt };
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("META_APP_ID / META_APP_SECRET が設定されていません");

  const url = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("fb_exchange_token", accessToken);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("set_token_expires_in_60_days", "true");

  const res = await fetch(url.toString());
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message: string };
  };
  if (!res.ok || json.error || !json.access_token) {
    throw new Error(`Metaトークンの更新に失敗しました: ${json.error?.message ?? `HTTP ${res.status}`}`);
  }

  // expires_in(秒)が返らない場合に備え、60日をフォールバックにする
  const expiresInSeconds = json.expires_in ?? 60 * 24 * 60 * 60;
  const newExpiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  const admin = createAdminClient();
  const { error: upsertError } = await admin.from("api_tokens").upsert({
    provider: PROVIDER,
    access_token: json.access_token,
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString(),
  });
  if (upsertError) throw new Error(`Metaトークンの保存に失敗しました: ${upsertError.message}`);

  return { refreshed: true, expiresAt: newExpiresAt };
}
