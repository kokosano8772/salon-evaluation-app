// 広告レポートAPI同期の「アカウントID」「キャンペーン名の絞り込みキーワード」を
// 店舗×プラットフォーム×区分ごとに記憶しておく窓口。stores.ad_sync_defaults
// （jsonb）に保存し、一度成功した組み合わせをどの月の同期でも自動で読み込んで使う。

import { createClient } from "@/lib/supabase/client";
import { AdPlatform, AdReportCategory } from "./ad-report-types";

export interface AdSyncDefault {
  accountId: string;
  campaignNameFilter: string;
  // 集客のキャンペーン名が求人キャンペーン名の部分文字列になっている店舗
  // （例: 集客「AmeLab」／求人「AmeLab（求人）」）では、絞り込みキーワードだけでは
  // 集客の同期に求人分まで混ざってしまう。このキーワードを含むキャンペーンを
  // 明示的に除外できるようにする（Google広告のみで使用）。
  campaignNameExclude?: string;
}

type AdSyncDefaultsMap = Record<string, AdSyncDefault>;

function keyFor(platform: AdPlatform, category: AdReportCategory): string {
  return `${platform}:${category}`;
}

export async function getAdSyncDefault(
  storeId: string,
  platform: AdPlatform,
  category: AdReportCategory
): Promise<AdSyncDefault | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("stores").select("ad_sync_defaults").eq("id", storeId).maybeSingle();
  if (error) throw error;
  const all = (data?.ad_sync_defaults as AdSyncDefaultsMap | null) ?? {};
  return all[keyFor(platform, category)] ?? null;
}

// 複数店舗分の同期設定を1回のクエリでまとめて取得する。「全店舗まとめて同期」機能で、
// 店舗ごとに何度も問い合わせずに済ませるために使う。設定が無い店舗はMapに含めない。
export async function listAdSyncDefaults(
  storeIds: string[],
  platform: AdPlatform,
  category: AdReportCategory
): Promise<Map<string, AdSyncDefault>> {
  const result = new Map<string, AdSyncDefault>();
  if (storeIds.length === 0) return result;

  const supabase = createClient();
  const { data, error } = await supabase.from("stores").select("id, ad_sync_defaults").in("id", storeIds);
  if (error) throw error;

  const key = keyFor(platform, category);
  for (const row of data ?? []) {
    const all = (row.ad_sync_defaults as AdSyncDefaultsMap | null) ?? {};
    const def = all[key];
    if (def) result.set(row.id, def);
  }
  return result;
}

export async function saveAdSyncDefault(
  storeId: string,
  platform: AdPlatform,
  category: AdReportCategory,
  value: AdSyncDefault
): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("stores").select("ad_sync_defaults").eq("id", storeId).maybeSingle();
  if (error) throw error;
  const all = (data?.ad_sync_defaults as AdSyncDefaultsMap | null) ?? {};
  all[keyFor(platform, category)] = value;

  const { error: updateError } = await supabase.from("stores").update({ ad_sync_defaults: all }).eq("id", storeId);
  if (updateError) throw updateError;
}
