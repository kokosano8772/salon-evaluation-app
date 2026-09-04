// Google Ads API・Meta Marketing APIから取得したデータをad_reportsに保存する前に
// 変換する共通フォーマット。フェーズ5で各プラットフォームのクライアントを実装する際、
// fetchMonthlyReportがこの型を返しさえすれば、保存処理（sync.ts）は変更不要になる
// （「外部APIとレポート生成ロジックを疎結合にする」という要件のための境界）。

import { AdReportPatch } from "@/lib/growth-db/ad-report-repository";

export type NormalizedAdReport = AdReportPatch;

// 一括同期（複数月まとめて）で、対象キャンペーンがまだ開始していない月まで範囲に
// 含めてしまった場合に投げる専用エラー。呼び出し側（sync route）で通常のエラーと
// 区別し、実績ゼロなだけの本物のレコードを作らずスキップできるようにする。
// GoogleAds/Meta両方のクライアントで共用する。
export class CampaignNotStartedError extends Error {}

export interface AdPlatformClient {
  /**
   * 指定アカウント・指定月のレポートを取得し、共通フォーマットに変換して返す。
   * @param accountId Google Ads の顧客ID、またはMeta広告アカウントID
   * @param yearMonth "YYYY-MM"
   * @param campaignNameFilter 1つの広告アカウントに複数店舗のキャンペーンが
   *   混在している場合に、キャンペーン名に含まれる文字列でその店舗の分だけに
   *   絞り込む（例: 店舗名）。省略時はアカウント内の全キャンペーンを対象にする。
   * @param campaignNameExclude campaignNameFilterに一致しつつ、この文字列も
   *   含むキャンペーンを除外する（例: 集客「AmeLab」が求人「AmeLab（求人）」を
   *   部分文字列として含んでしまう場合に「求人」を指定して除外する）。
   */
  fetchMonthlyReport(
    accountId: string,
    yearMonth: string,
    campaignNameFilter?: string,
    campaignNameExclude?: string
  ): Promise<NormalizedAdReport>;
}
