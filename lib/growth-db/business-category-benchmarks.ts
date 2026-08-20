// Google広告レポートの「予約/問い合わせボタンを押した割合」を評価するための、
// 業種別のベンチマーク値。ここに無い業種（未設定・未追加分）はベンチマーク行を
// 表示しない（無い数値を憶測で出さないため）。
// 値が分かり次第、このテーブルに追記していく運用にする。

export interface BusinessCategoryBenchmark {
  // 自社（ココデザイン）クライアントでの、その業種の平均値
  ownAverage: number;
}

export const BUSINESS_CATEGORY_BENCHMARKS: Record<string, BusinessCategoryBenchmark> = {
  美容院: { ownAverage: 16.64 },
  メンズサロン: { ownAverage: 32.82 },
};

// 業種を問わず固定のココデザインでの目標値
export const AD_REPORT_TARGET_RATE = 8;

// 業種別の全国平均は公表データが乏しいため、公表されている美容院の全国平均値を
// 業種を問わず参考値として表示する（実物PDFの表記に合わせる）。
export const NATIONAL_AVERAGE_CVR = 5;

export function getBusinessCategoryBenchmark(businessCategory: string): BusinessCategoryBenchmark | null {
  return BUSINESS_CATEGORY_BENCHMARKS[businessCategory] ?? null;
}
