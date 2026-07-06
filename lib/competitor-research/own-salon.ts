// 成長データベースの店舗データから「自社」比較行を合成する。
// investigation-appでは全て手入力だった自社データを、既に登録済みの
// Store/MonthlyMetricsから可能な範囲で自動プリフィルする（対応項目が無いものは
// 空のまま=手入力に委ねる。無理に推測はしない）。

import { Store, MonthlyMetrics } from "@/lib/growth-db/types";
import { AttractionData, RecruitmentData, SalonData } from "./types";

export function buildOwnSalonFromStore(
  store: Store,
  latestMonthly: MonthlyMetrics | null
): SalonData {
  const googleBusiness = latestMonthly?.googleBusiness;

  const attraction: AttractionData = {
    priceRange: store.averageUnitPrice
      ? `¥${store.averageUnitPrice.toLocaleString("ja-JP")}前後`
      : "",
    businessHours: store.businessHours,
    closedDays: store.businessDays,
    seatCount: store.seatCount,
    staffCount: store.staffCount,
    ageTarget: store.targetCustomer,
    reviewCount: googleBusiness?.reviewCount,
    rating: googleBusiness?.averageRating,
  };

  const recruitment: RecruitmentData = {
    businessHours: store.businessHours,
  };

  return {
    id: `own_${store.id}`,
    name: store.name,
    area: store.area,
    genre: "hair",
    rating: googleBusiness?.averageRating ?? 0,
    reviewCount: googleBusiness?.reviewCount ?? 0,
    isOwn: true,
    attraction,
    recruitment,
  };
}
