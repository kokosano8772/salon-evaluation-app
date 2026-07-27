// Meta Marketing API（Instagram/Facebook広告）との実連携（Phase 5）のプレースホルダー。
// 現時点ではアプリ審査・アクセストークンが未取得のため、実装せずインターフェースの
// 土台だけ用意する。
//
// 実装時の手順（未着手）:
// 1. Meta for Developers でアプリを作成し、Marketing API を追加する
// 2. Business Manager 上で対象の広告アカウントへのアクセス権を持つ
//    システムユーザートークン（長期のアクセストークン）を発行する
// 3. 本番相当のデータを扱う場合はアプリ審査（App Review）が必要になる場合がある
// 4. 公式SDK（例: npm の `facebook-nodejs-business-sdk`）またはGraph API直叩きで、
//    Insights APIからキャンペーン別・性別別・時間帯別・年齢層別の指標を取得し、
//    下記 fetchMonthlyReport 内で NormalizedAdReport（lib/growth-db/ad-report-repository.ts
//    の AdReportPatch）に変換する。フィールド対応は正式ドキュメントで要確認、
//    ここでは推測で書かない。
//
// 環境変数は META_APP_ID / META_APP_SECRET / META_ACCESS_TOKEN などを想定（未設定）。

import { AdPlatformClient, NormalizedAdReport } from "./types";

export class MetaAdsClient implements AdPlatformClient {
  async fetchMonthlyReport(_accountId: string, _yearMonth: string): Promise<NormalizedAdReport> {
    throw new Error(
      "Meta Marketing APIとの連携は未実装です。アクセストークンの発行が完了したら " +
        "lib/ad-platforms/meta-ads-client.ts の fetchMonthlyReport を実装してください。"
    );
  }
}
