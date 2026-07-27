// Google Ads API・Meta Marketing APIから取得したデータをad_reportsに保存する前に
// 変換する共通フォーマット。フェーズ5で各プラットフォームのクライアントを実装する際、
// fetchMonthlyReportがこの型を返しさえすれば、保存処理（sync.ts）は変更不要になる
// （「外部APIとレポート生成ロジックを疎結合にする」という要件のための境界）。

import { AdReportPatch } from "@/lib/growth-db/ad-report-repository";

export type NormalizedAdReport = AdReportPatch;

export interface AdPlatformClient {
  /**
   * 指定アカウント・指定月のレポートを取得し、共通フォーマットに変換して返す。
   * @param accountId Google Ads の顧客ID、またはMeta広告アカウントID
   * @param yearMonth "YYYY-MM"
   * @param campaignNameFilter 1つの広告アカウントに複数店舗のキャンペーンが
   *   混在している場合に、キャンペーン名に含まれる文字列でその店舗の分だけに
   *   絞り込む（例: 店舗名）。省略時はアカウント内の全キャンペーンを対象にする。
   */
  fetchMonthlyReport(accountId: string, yearMonth: string, campaignNameFilter?: string): Promise<NormalizedAdReport>;
}
