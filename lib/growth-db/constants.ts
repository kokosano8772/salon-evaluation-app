import { AcquisitionChannelId, GrowthCategoryId } from "./types";

// 店舗一覧の絞り込み・シードデータ生成で使うエリア一覧
export const AREAS = [
  "東京都渋谷区",
  "東京都新宿区",
  "東京都世田谷区",
  "神奈川県横浜市",
  "大阪府大阪市",
  "愛知県名古屋市",
  "福岡県福岡市",
  "北海道札幌市",
] as const;

export const ACQUISITION_CHANNELS: { id: AcquisitionChannelId; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "googleAds", label: "Google広告" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "line", label: "LINE" },
  { id: "referral", label: "紹介" },
  { id: "seo", label: "SEO" },
  { id: "aiSearch", label: "AI検索" },
  { id: "other", label: "その他" },
];

export const JOB_MEDIA = [
  "リジョブ",
  "ホットペッパービューティーワーク",
  "Indeed",
  "美プロ",
  "自社採用サイト",
  "紹介",
] as const;

export const TARGET_CUSTOMER_OPTIONS = [
  "10〜20代女性",
  "20〜30代女性",
  "30〜40代女性",
  "ファミリー層",
  "メンズ全般",
  "シニア層",
] as const;

// 同規模比較の分類軸（優先順位: スタッフ人数 > 客単価 > 商圏 > 店舗形態 > 席数）
export const TRADE_AREA_OPTIONS = ["都市部", "地方都市", "郊外"] as const;

export const STORE_FORMAT_OPTIONS = ["単店舗", "多店舗", "マンツーマン"] as const;

// Google広告レポートの業種別ベンチマーク表示に使う業種区分
export const BUSINESS_CATEGORY_OPTIONS = ["美容院", "メンズサロン", "アイラッシュ", "ネイル"] as const;

export const GROWTH_CATEGORY_META: Record<
  GrowthCategoryId,
  { name: string; nameEn: string; icon: string; color: string; description: string }
> = {
  acquisition: {
    name: "集客力",
    nameEn: "Acquisition Power",
    icon: "Megaphone",
    color: "#C4788A",
    description: "各集客チャネルからの流入・来店・費用対効果の強さ",
  },
  repeat: {
    name: "リピート力",
    nameEn: "Repeat Power",
    icon: "Repeat2",
    color: "#7C9EB5",
    description: "既存客の再来店・指名・LINE登録などの定着度",
  },
  brand: {
    name: "ブランド力",
    nameEn: "Brand Power",
    icon: "Sparkles",
    color: "#9B8DBF",
    description: "Google評価・紹介・NPS・指名検索などの認知と信頼",
  },
  recruitment: {
    name: "採用力",
    nameEn: "Recruitment Power",
    icon: "UserPlus",
    color: "#6BAB8A",
    description: "求人応募から採用までのファネルの強さ",
  },
  organization: {
    name: "組織力",
    nameEn: "Organization Power",
    icon: "Network",
    color: "#E08B6B",
    description: "定着率・教育制度・マニュアル整備などの仕組み化度合い",
  },
};
