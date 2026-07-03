// 美容室成長データベース専用の型定義。
// 診断機能（lib/types.ts, lib/scoring.ts, lib/quick-scoring.ts）とは完全に独立させ、相互importしない。

export type AcquisitionChannelId =
  | "google"
  | "googleAds"
  | "instagram"
  | "tiktok"
  | "line"
  | "referral"
  | "seo"
  | "aiSearch"
  | "other";

export interface AcquisitionChannelMetrics {
  channel: AcquisitionChannelId;
  inflow: number; // 流入
  bookings: number; // 予約
  visits: number; // 来店
  cpa: number; // CPA（円）
  cvr: number; // CVR（%、来店/流入）
}

export interface RecruitingMediumMetrics {
  medium: string; // 媒体名
  applications: number; // 応募
  visits: number; // 見学
  interviews: number; // 面接
  hires: number; // 採用
  applicationRate: number; // 応募率（%）
  visitRate: number; // 見学率（%）
  hireRate: number; // 採用率（%）
  costPerHire: number; // 採用単価（円）
}

export interface RevenueMetrics {
  totalRevenue: number; // 総売上
  technicalRevenue: number; // 技術売上
  retailRevenue: number; // 店販売上
  averageUnitPrice: number; // 客単価
  totalVisits: number; // 総来店数
  newCustomers: number; // 新規
  existingCustomers: number; // 既存
  yoyRate: number; // 前年比（%）
}

export interface RepeatMetrics {
  firstVisitRate: number; // 初回来店率（%）
  thirdVisitRate: number; // 3回来店率（%）
  existingRepeatRate: number; // 既存リピート率（%）
  visitCycleDays: number; // 来店周期（日）
  churnRate: number; // 失客率（%）
  nextBookingRate: number; // 次回予約率（%）
  lineRegistrationRate: number; // LINE登録率（%）
  designationRate: number; // 指名率（%）
}

export interface GoogleBusinessMetrics {
  reviewCount: number; // 口コミ数
  averageRating: number; // 平均評価（1-5）
  views: number; // 閲覧数
  calls: number; // 電話数
  routeSearches: number; // ルート検索
  webClicks: number; // WEBクリック
  postCount: number; // 投稿数
  photoCount: number; // 写真数
  replyRate: number; // 返信率（%）
}

export interface WebsiteMetrics {
  seoArticleCount: number; // SEO記事数
  servicePageCount: number; // サービスページ数
  faqCount: number; // FAQ数
  caseStudyCount: number; // 事例数
  testimonialCount: number; // お客様の声数
  hasStaffPage: boolean; // スタッフページ有無
  aiSearchListed: boolean; // AI検索掲載有無
}

export interface InstagramMetrics {
  followers: number; // フォロワー
  posts: number; // 投稿
  saves: number; // 保存数
  reels: number; // リール投稿数
  profileAccess: number; // プロフィールアクセス
  lineReferrals: number; // LINE遷移数
}

export interface TiktokMetrics {
  followers: number; // フォロワー
  views: number; // 再生数
  inquiries: number; // 問い合わせ
}

export interface SnsMetrics {
  instagram: InstagramMetrics;
  tiktok: TiktokMetrics;
}

export interface RetentionMetrics {
  oneYearRetentionRate: number; // 1年定着率（%）
  threeYearRetentionRate: number; // 3年定着率（%）
  turnoverRate: number; // 離職率（%）
  managerCount: number; // 店長数
  executiveCount: number; // 幹部数
  educationSystemLevel: number; // 教育制度整備度（0-3）
  evaluationSystemLevel: number; // 評価制度整備度（0-3）
  manualLevel: number; // マニュアル整備度（0-3）
}

export interface ProductivityMetrics {
  averageRevenue: number; // 平均売上（スタッフ一人あたりの平均）
  topRevenue: number; // トップ売上
  lowestRevenue: number; // 最低売上
  revenuePerStaff: number; // 一人当たり売上
  revenuePerHour: number; // 時間売上
  utilizationRate: number; // 稼働率（%）
  retailRatio: number; // 店販比率（%）
}

export interface BrandMetrics {
  googleRating: number; // Google評価（1-5）
  referralRate: number; // 紹介率（%）
  nps: number; // NPS（-100〜100）
  satisfactionScore: number; // アンケート満足度（0-100）
  brandSearchVolume: number; // ブランド検索数
  designationSearchVolume: number; // 指名検索数
}

export interface ManagementMetrics {
  rentRatio: number; // 家賃比率（%）
  laborCostRatio: number; // 人件費率（%）
  adCostRatio: number; // 広告費率（%）
  costRatio: number; // 原価率（%）
  operatingMarginRatio: number; // 営業利益率（%）
}

export interface BasicSnapshotMetrics {
  staffCount?: number; // その月時点のスタッフ数
  averageUnitPrice?: number; // その月時点の客単価
}

// 各データ領域は月ごとに未入力でありうるため任意（optional）にしている。
// スコアリング側は欠損を「0点」ではなく「データ無し」として扱う（lib/growth-db/scoring.ts参照）。
export interface MonthlyMetrics {
  storeId: string;
  yearMonth: string; // "YYYY-MM"
  revenue?: RevenueMetrics;
  acquisition?: AcquisitionChannelMetrics[];
  repeat?: RepeatMetrics;
  googleBusiness?: GoogleBusinessMetrics;
  website?: WebsiteMetrics;
  sns?: SnsMetrics;
  recruiting?: RecruitingMediumMetrics[];
  retention?: RetentionMetrics;
  productivity?: ProductivityMetrics;
  brand?: BrandMetrics;
  management?: ManagementMetrics;
  basicSnapshot?: BasicSnapshotMetrics;
  updatedAt: string;
}

export type MonthlyMetricsDomainKey =
  | "revenue"
  | "acquisition"
  | "repeat"
  | "googleBusiness"
  | "website"
  | "sns"
  | "recruiting"
  | "retention"
  | "productivity"
  | "brand"
  | "management";

// 基本情報：変動しにくい店舗レベルの項目。スタッフ数・客単価など月次で動く値は
// MonthlyMetrics.basicSnapshot に月次ミラーを持たせ、こちらは「現在値」として扱う。
export interface Store {
  id: string;
  name: string;
  phone: string;
  area: string;
  openedYear: number;
  storeCount: number;
  seatCount: number;
  businessHours: string;
  businessDays: string;
  staffCount: number;
  targetCustomer: string;
  averageUnitPrice: number;
  // 同規模・地域平均比較で使う分類軸。既存店舗では未設定（空文字）の場合がある。
  tradeArea: string;
  storeFormat: string;
  createdAt: string;
  updatedAt: string;
}

export type GrowthCategoryId =
  | "acquisition"
  | "repeat"
  | "brand"
  | "recruitment"
  | "organization";

export interface GrowthCategoryScore {
  categoryId: GrowthCategoryId;
  name: string;
  nameEn: string;
  score: number;
  maxScore: number;
  percentage: number;
  color: string;
}

// 詳細診断(/diagnosis)から連携された結果の参照用スナップショット。
// あくまで店舗情報の連携であり、GrowthScoreの計算には一切使用しない。
export interface LinkedDiagnosisResult {
  id: string;
  storeId: string | null;
  salonName: string;
  salonPhone: string;
  totalScore: number;
  rank: string;
  categoryScores: {
    categoryId: string;
    name: string;
    nameEn: string;
    score: number;
    maxScore: number;
    percentage: number;
    color: string;
  }[];
  completedAt: string;
  status: "pending" | "reviewed";
  createdAt: string;
}

// Store(1) — MonthlyMetrics(多) の実データから都度計算される純粋な派生値。
// lib/scoring.ts の calculateResult と同様、永続化はせず必要な時に計算する。
export interface GrowthScore {
  storeId: string;
  yearMonth: string;
  totalScore: number;
  categoryScores: GrowthCategoryScore[];
  computedAt: string;
}
