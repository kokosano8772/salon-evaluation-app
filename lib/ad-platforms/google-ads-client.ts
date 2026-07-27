// Google Ads APIとの実連携（Phase 5）のプレースホルダー。
// 現時点では開発者トークンが未取得のため、実装せずインターフェースの土台だけ用意する。
//
// 実装時の手順（未着手）:
// 1. Google Ads の Manager Account（MCC）で開発者トークンを申請・承認を受ける
//    https://ads.google.com/ の「ツールと設定」→「API センター」
// 2. Google Cloud Console で OAuth2クライアントID/シークレットを発行し、
//    対象の広告アカウントに対するリフレッシュトークンを取得する
// 3. 公式/準公式のNode.jsクライアントライブラリ（例: npm の `google-ads-api`）を追加する
// 4. GAQL（Google Ads Query Language）でキャンペーン別の指標（インプレッション・
//    クリック・費用・コンバージョン等）を取得し、下記 fetchMonthlyReport 内で
//    NormalizedAdReport（lib/growth-db/ad-report-repository.ts の AdReportPatch）
//    に変換する。フィールド対応は正式ドキュメントで要確認、ここでは推測で書かない。
//
// 環境変数は GOOGLE_ADS_DEVELOPER_TOKEN / GOOGLE_ADS_CLIENT_ID などを想定（未設定）。

import { AdPlatformClient, NormalizedAdReport } from "./types";

export class GoogleAdsClient implements AdPlatformClient {
  async fetchMonthlyReport(_accountId: string, _yearMonth: string): Promise<NormalizedAdReport> {
    throw new Error(
      "Google Ads APIとの連携は未実装です。開発者トークンの申請・OAuth設定が完了したら " +
        "lib/ad-platforms/google-ads-client.ts の fetchMonthlyReport を実装してください。"
    );
  }
}
