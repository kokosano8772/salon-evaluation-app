// 各データ領域の初期値（フォームを開いたときに空のスロットを表示するためのゼロ埋め値）
import { ACQUISITION_CHANNELS, JOB_MEDIA } from "./constants";
import {
  AcquisitionChannelMetrics,
  BrandMetrics,
  GoogleBusinessMetrics,
  ManagementMetrics,
  MonthlyMetrics,
  ProductivityMetrics,
  RecruitingMediumMetrics,
  RepeatMetrics,
  RetentionMetrics,
  RevenueMetrics,
  SnsMetrics,
  WebsiteMetrics,
} from "./types";

export function defaultRevenue(): RevenueMetrics {
  return {
    totalRevenue: 0,
    technicalRevenue: 0,
    retailRevenue: 0,
    averageUnitPrice: 0,
    totalVisits: 0,
    newCustomers: 0,
    existingCustomers: 0,
    yoyRate: 0,
  };
}

export function defaultAcquisition(): AcquisitionChannelMetrics[] {
  return ACQUISITION_CHANNELS.map(({ id }) => ({
    channel: id,
    inflow: 0,
    bookings: 0,
    visits: 0,
    cpa: 0,
    cvr: 0,
  }));
}

export function defaultRepeat(): RepeatMetrics {
  return {
    firstVisitRate: 0,
    thirdVisitRate: 0,
    existingRepeatRate: 0,
    visitCycleDays: 0,
    churnRate: 0,
    nextBookingRate: 0,
    lineRegistrationRate: 0,
    designationRate: 0,
  };
}

export function defaultGoogleBusiness(): GoogleBusinessMetrics {
  return {
    reviewCount: 0,
    averageRating: 0,
    views: 0,
    calls: 0,
    routeSearches: 0,
    webClicks: 0,
    postCount: 0,
    photoCount: 0,
    replyRate: 0,
  };
}

export function defaultWebsite(): WebsiteMetrics {
  return {
    seoArticleCount: 0,
    servicePageCount: 0,
    faqCount: 0,
    caseStudyCount: 0,
    testimonialCount: 0,
    hasStaffPage: false,
    aiSearchListed: false,
  };
}

export function defaultSns(): SnsMetrics {
  return {
    instagram: { followers: 0, posts: 0, saves: 0, reels: 0, profileAccess: 0, lineReferrals: 0 },
    tiktok: { followers: 0, views: 0, inquiries: 0 },
  };
}

export function defaultRecruiting(): RecruitingMediumMetrics[] {
  return JOB_MEDIA.map((medium) => ({
    medium,
    applications: 0,
    visits: 0,
    interviews: 0,
    hires: 0,
    applicationRate: 0,
    visitRate: 0,
    hireRate: 0,
    costPerHire: 0,
  }));
}

export function defaultRetention(): RetentionMetrics {
  return {
    oneYearRetentionRate: 0,
    threeYearRetentionRate: 0,
    turnoverRate: 0,
    managerCount: 0,
    executiveCount: 0,
    educationSystemLevel: 0,
    evaluationSystemLevel: 0,
    manualLevel: 0,
  };
}

export function defaultProductivity(): ProductivityMetrics {
  return {
    averageRevenue: 0,
    topRevenue: 0,
    lowestRevenue: 0,
    revenuePerStaff: 0,
    revenuePerHour: 0,
    utilizationRate: 0,
    retailRatio: 0,
  };
}

export function defaultBrand(): BrandMetrics {
  return {
    googleRating: 0,
    referralRate: 0,
    nps: 0,
    satisfactionScore: 0,
    brandSearchVolume: 0,
    designationSearchVolume: 0,
  };
}

export function defaultManagement(): ManagementMetrics {
  return { rentRatio: 0, laborCostRatio: 0, adCostRatio: 0, costRatio: 0, operatingMarginRatio: 0 };
}

export function withDefaults(storeId: string, yearMonth: string, existing: MonthlyMetrics | null): Required<
  Omit<MonthlyMetrics, "basicSnapshot">
> &
  Pick<MonthlyMetrics, "basicSnapshot"> {
  return {
    storeId,
    yearMonth,
    revenue: existing?.revenue ?? defaultRevenue(),
    acquisition: existing?.acquisition ?? defaultAcquisition(),
    repeat: existing?.repeat ?? defaultRepeat(),
    googleBusiness: existing?.googleBusiness ?? defaultGoogleBusiness(),
    website: existing?.website ?? defaultWebsite(),
    sns: existing?.sns ?? defaultSns(),
    recruiting: existing?.recruiting ?? defaultRecruiting(),
    retention: existing?.retention ?? defaultRetention(),
    productivity: existing?.productivity ?? defaultProductivity(),
    brand: existing?.brand ?? defaultBrand(),
    management: existing?.management ?? defaultManagement(),
    basicSnapshot: existing?.basicSnapshot,
    updatedAt: existing?.updatedAt ?? new Date().toISOString(),
  };
}
