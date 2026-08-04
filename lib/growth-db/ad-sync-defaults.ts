// 広告レポートAPI同期の「アカウントID」「キャンペーン名の絞り込みキーワード」を
// 店舗×プラットフォーム×区分ごとに記憶しておく窓口。stores.ad_sync_defaults
// （jsonb）に保存し、一度成功した組み合わせをどの月の同期でも自動で読み込んで使う。

import { createClient } from "@/lib/supabase/client";
import { AdPlatform, AdReportCategory } from "./ad-report-types";

export interface AdSyncDefault {
  accountId: string;
  campaignNameFilter: string;
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
