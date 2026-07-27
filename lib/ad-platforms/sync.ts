// 外部API（Google Ads / Meta Marketing API）から取得した正規化済みデータを
// ad_reportsに保存する。GoogleAdsClient / MetaAdsClient の fetchMonthlyReport が
// 実装され次第、この関数はそのまま使える（呼び出し側・保存処理は変更不要）。

import { upsertAdReport } from "@/lib/growth-db/ad-report-repository";
import { AdReport, AdPlatform } from "@/lib/growth-db/ad-report-types";
import { AdPlatformClient } from "./types";

export async function syncAdReport(
  client: AdPlatformClient,
  storeId: string,
  platform: AdPlatform,
  accountId: string,
  yearMonth: string
): Promise<AdReport> {
  const normalized = await client.fetchMonthlyReport(accountId, yearMonth);
  return upsertAdReport(storeId, yearMonth, platform, { ...normalized, accountId });
}
