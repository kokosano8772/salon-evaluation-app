// Google広告レポートの「予約/問い合わせボタンを押した割合」を評価するための、
// 業種を問わず固定の参考値。
// 自社（ココデザイン）クライアントでの業種別平均は固定値ではなく、実際の契約状況
// から毎回ライブ集計する（lib/growth-db/ad-report-repository.ts の
// getBusinessCategoryAverageCvr を参照）。

// 業種を問わず固定のココデザインでの目標値
export const AD_REPORT_TARGET_RATE = 8;

// 業種別の全国平均は公表データが乏しいため、公表されている美容院の全国平均値を
// 業種を問わず参考値として表示する（実物PDFの表記に合わせる）。
export const NATIONAL_AVERAGE_CVR = 5;
