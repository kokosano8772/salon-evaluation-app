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
  Store,
  WebsiteMetrics,
} from "./types";
import { ACQUISITION_CHANNELS, AREAS, JOB_MEDIA, TARGET_CUSTOMER_OPTIONS } from "./constants";
import { shiftYearMonth, currentYearMonth } from "./format";

// ダミーデータを毎回同じ内容で再現するための簡易決定論的PRNG（mulberry32）。
// 外部ライブラリは追加しない。
function createRng(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const range = (rng: () => number, min: number, max: number) => min + rng() * (max - min);
const intRange = (rng: () => number, min: number, max: number) => Math.round(range(rng, min, max));
const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const STORE_COUNT = 28;
const MONTHS_PER_STORE = 24;

const STORE_NAMES = [
  "hair salon Rume", "Agu hair Lino", "salon Coco", "HAIR SALON Fleur",
  "美容室 結", "hair make Anela", "salon Miel", "HAIR STUDIO Nagi",
  "美容室 凪", "salon Kinari", "HAIR SALON Sora", "hair salon Iori",
  "美容室 紬", "salon Hanare", "HAIR DESIGN Ash", "salon Riz",
  "美容室 彩", "hair salon Yui", "HAIR SALON Lala", "salon Nora",
  "美容室 蒼", "hair studio Mie", "salon Tsumugi", "HAIR SALON Reo",
  "美容室 花音", "salon Aoi", "HAIR MAKE Suzu", "美容室 陽だまり",
];

interface StoreProfile {
  store: Store;
  baseQuality: number; // 0-1、その店舗の総合的な地力
  growthSlope: number; // 月あたりの成長/衰退傾き
  hasTiktok: boolean;
  tracksWebsite: boolean;
}

function buildStoreProfiles(): StoreProfile[] {
  const now = currentYearMonth();
  return STORE_NAMES.slice(0, STORE_COUNT).map((name, i) => {
    const rng = createRng(1000 + i * 97);
    const baseQuality = clamp01(range(rng, 0.25, 0.92));
    const growthSlope = range(rng, -0.12, 0.3);
    const staffCount = intRange(rng, 3, 24);
    const openedYear = Number(now.split("-")[0]) - intRange(rng, 1, 22);

    const store: Store = {
      id: `store-${String(i + 1).padStart(3, "0")}`,
      name,
      area: AREAS[i % AREAS.length],
      openedYear,
      storeCount: rng() < 0.15 ? intRange(rng, 2, 5) : 1,
      seatCount: Math.max(2, Math.round(staffCount * range(rng, 0.8, 1.4))),
      businessHours: "10:00〜19:00",
      businessDays: rng() < 0.5 ? "水曜定休" : "月曜定休",
      staffCount,
      targetCustomer: TARGET_CUSTOMER_OPTIONS[i % TARGET_CUSTOMER_OPTIONS.length],
      averageUnitPrice: Math.round(range(rng, 5500, 13500)),
      createdAt: new Date(openedYear, 0, 1).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      store,
      baseQuality,
      growthSlope,
      hasTiktok: rng() < 0.6,
      tracksWebsite: rng() < 0.7,
    };
  });
}

function qualityAtMonth(profile: StoreProfile, monthIndex: number, rng: () => number) {
  const t = monthIndex / MONTHS_PER_STORE;
  const noise = range(rng, -0.05, 0.05);
  return clamp01(profile.baseQuality + profile.growthSlope * t + noise);
}

function genRevenue(quality: number, staffCount: number, rng: () => number): RevenueMetrics {
  const totalVisits = intRange(rng, 150, 750) * (0.5 + quality * 0.8);
  const newRatio = range(rng, 0.15, 0.4) * (1.3 - quality);
  const newCustomers = Math.round(totalVisits * clamp01(newRatio));
  const existingCustomers = Math.round(totalVisits - newCustomers);
  const averageUnitPrice = Math.round(range(rng, 5500, 13500) * (0.7 + quality * 0.5));
  const totalRevenue = Math.round(totalVisits * averageUnitPrice);
  const technicalRevenue = Math.round(totalRevenue * range(rng, 0.75, 0.88));
  const retailRevenue = totalRevenue - technicalRevenue;
  return {
    totalRevenue,
    technicalRevenue,
    retailRevenue,
    averageUnitPrice,
    totalVisits: Math.round(totalVisits),
    newCustomers,
    existingCustomers,
    yoyRate: round1(range(rng, -8, 10) + quality * 18),
  };
}

function genAcquisition(quality: number, rng: () => number): AcquisitionChannelMetrics[] {
  return ACQUISITION_CHANNELS.map(({ id }) => {
    const inflow = Math.max(0, Math.round(range(rng, 10, 250) * (0.4 + quality)));
    const bookings = Math.round(inflow * range(rng, 0.3, 0.65));
    const visits = Math.round(bookings * range(rng, 0.7, 0.95));
    const cvr = inflow > 0 ? round1((visits / inflow) * 100) : 0;
    const cpa =
      id === "googleAds"
        ? Math.round(range(rng, 1500, 9000) * (1.3 - quality))
        : id === "referral" || id === "seo"
          ? 0
          : Math.round(range(rng, 500, 3000) * (1.2 - quality));
    return { channel: id, inflow, bookings, visits, cpa, cvr };
  });
}

function genRepeat(quality: number, rng: () => number): RepeatMetrics {
  return {
    firstVisitRate: round1(range(rng, 30, 55) + quality * 15),
    thirdVisitRate: round1(range(rng, 15, 35) + quality * 20),
    existingRepeatRate: round1(range(rng, 25, 45) + quality * 30),
    visitCycleDays: Math.round(range(rng, 60, 50) - quality * 15),
    churnRate: round1(range(rng, 5, 25) * (1.3 - quality)),
    nextBookingRate: round1(range(rng, 20, 40) + quality * 35),
    lineRegistrationRate: round1(range(rng, 20, 45) + quality * 40),
    designationRate: round1(range(rng, 15, 35) + quality * 45),
  };
}

function genGoogleBusiness(quality: number, monthIndex: number, rng: () => number): GoogleBusinessMetrics {
  return {
    reviewCount: Math.round(10 + monthIndex * range(rng, 0.5, 2.5) * (0.5 + quality)),
    averageRating: round1(Math.min(5, 3.2 + quality * 1.6 + range(rng, -0.15, 0.15))),
    views: Math.round(range(rng, 300, 3500) * (0.4 + quality)),
    calls: Math.round(range(rng, 5, 60) * (0.4 + quality)),
    routeSearches: Math.round(range(rng, 10, 120) * (0.4 + quality)),
    webClicks: Math.round(range(rng, 10, 200) * (0.4 + quality)),
    postCount: intRange(rng, 0, 8),
    photoCount: Math.round(20 + monthIndex * range(rng, 0.5, 2)),
    replyRate: round1(clamp01(range(rng, 0.2, 0.5) + quality * 0.5) * 100),
  };
}

function genWebsite(quality: number, monthIndex: number, rng: () => number): WebsiteMetrics {
  return {
    seoArticleCount: Math.round(monthIndex * range(rng, 0.3, 1.5) * (0.4 + quality)),
    servicePageCount: intRange(rng, 3, 12),
    faqCount: intRange(rng, 0, 15),
    caseStudyCount: intRange(rng, 0, 20),
    testimonialCount: intRange(rng, 0, 25),
    hasStaffPage: quality > 0.45,
    aiSearchListed: quality > 0.68 && monthIndex > MONTHS_PER_STORE * 0.5,
  };
}

function genSns(quality: number, monthIndex: number, hasTiktok: boolean, rng: () => number): SnsMetrics {
  const igFollowersBase = 200 + monthIndex * range(rng, 15, 90) * (0.4 + quality);
  return {
    instagram: {
      followers: Math.round(igFollowersBase),
      posts: intRange(rng, 2, 20),
      saves: Math.round(range(rng, 5, 300) * (0.4 + quality)),
      reels: intRange(rng, 0, 10),
      profileAccess: Math.round(range(rng, 50, 1500) * (0.4 + quality)),
      lineReferrals: Math.round(range(rng, 0, 80) * (0.4 + quality)),
    },
    tiktok: hasTiktok
      ? {
          followers: Math.round(50 + monthIndex * range(rng, 5, 60) * (0.4 + quality)),
          views: Math.round(range(rng, 200, 20000) * (0.3 + quality)),
          inquiries: intRange(rng, 0, 15),
        }
      : { followers: 0, views: 0, inquiries: 0 },
  };
}

function genRecruiting(quality: number, rng: () => number): RecruitingMediumMetrics[] {
  const mediaCount = intRange(rng, 1, 3);
  const media = [...JOB_MEDIA].sort(() => rng() - 0.5).slice(0, mediaCount);
  return media.map((medium) => {
    const applications = intRange(rng, 0, 8) + Math.round(quality * 4);
    const visits = Math.round(applications * range(rng, 0.4, 0.8));
    const interviews = Math.round(visits * range(rng, 0.5, 0.9));
    const hires = Math.round(interviews * range(rng, 0.2, 0.6));
    return {
      medium,
      applications,
      visits,
      interviews,
      hires,
      applicationRate: applications > 0 ? round1((visits / applications) * 100) : 0,
      visitRate: visits > 0 ? round1((interviews / visits) * 100) : 0,
      hireRate: interviews > 0 ? round1((hires / interviews) * 100) : 0,
      costPerHire: hires > 0 ? Math.round(range(rng, 80000, 400000) * (1.3 - quality)) : 0,
    };
  });
}

function genRetention(quality: number, staffCount: number, rng: () => number): RetentionMetrics {
  return {
    oneYearRetentionRate: round1(range(rng, 50, 70) + quality * 25),
    threeYearRetentionRate: round1(range(rng, 25, 45) + quality * 30),
    turnoverRate: round1(range(rng, 8, 30) * (1.3 - quality)),
    managerCount: Math.max(1, Math.round(staffCount * range(rng, 0.08, 0.15))),
    executiveCount: Math.max(0, Math.round(staffCount * range(rng, 0.03, 0.1))),
    educationSystemLevel: intRange(rng, 0, Math.round(quality * 3)),
    evaluationSystemLevel: intRange(rng, 0, Math.round(quality * 3)),
    manualLevel: intRange(rng, 0, Math.round(quality * 3)),
  };
}

function genProductivity(quality: number, staffCount: number, revenue: RevenueMetrics, rng: () => number): ProductivityMetrics {
  const revenuePerStaff = Math.round(revenue.totalRevenue / staffCount);
  return {
    averageRevenue: revenuePerStaff,
    topRevenue: Math.round(revenuePerStaff * range(rng, 1.3, 1.8)),
    lowestRevenue: Math.round(revenuePerStaff * range(rng, 0.4, 0.7)),
    revenuePerStaff,
    revenuePerHour: Math.round(range(rng, 2500, 6000) * (0.6 + quality * 0.6)),
    utilizationRate: round1(range(rng, 40, 60) + quality * 30),
    retailRatio: round1((revenue.retailRevenue / revenue.totalRevenue) * 100),
  };
}

function genBrand(quality: number, googleRating: number, rng: () => number): BrandMetrics {
  return {
    googleRating: round1(googleRating + range(rng, -0.1, 0.1)),
    referralRate: round1(range(rng, 3, 12) + quality * 15),
    nps: Math.round(range(rng, -20, 10) + quality * 70),
    satisfactionScore: round1(range(rng, 50, 70) + quality * 25),
    brandSearchVolume: Math.round(range(rng, 20, 300) * (0.4 + quality)),
    designationSearchVolume: Math.round(range(rng, 10, 200) * (0.4 + quality)),
  };
}

function genManagement(quality: number, rng: () => number): ManagementMetrics {
  const rentRatio = round1(range(rng, 6, 12));
  const laborCostRatio = round1(range(rng, 35, 50) - quality * 5);
  const adCostRatio = round1(range(rng, 3, 10) * (1.2 - quality * 0.5));
  const costRatio = round1(range(rng, 8, 15));
  const operatingMarginRatio = round1(100 - rentRatio - laborCostRatio - adCostRatio - costRatio - range(rng, 15, 30));
  return { rentRatio, laborCostRatio, adCostRatio, costRatio, operatingMarginRatio };
}

function buildMonthlyMetricsForStore(profile: StoreProfile): MonthlyMetrics[] {
  const rng = createRng(5000 + Number(profile.store.id.slice(-3)) * 13);
  const months: MonthlyMetrics[] = [];

  for (let m = 0; m < MONTHS_PER_STORE; m++) {
    const yearMonth = shiftYearMonth(currentYearMonth(), -(MONTHS_PER_STORE - 1 - m));
    const quality = qualityAtMonth(profile, m, rng);
    const revenue = genRevenue(quality, profile.store.staffCount, rng);
    const googleBusiness = genGoogleBusiness(quality, m, rng);

    // 序盤の数ヶ月は「まだ運用しきれていない」を再現するため一部領域を意図的に欠損させる
    // → lib/growth-db/scoring.ts の欠損データフォールバックの検証材料にもなる
    const isEarly = m < 3;
    const includeRecruiting = rng() < 0.65;
    const includeWebsite = profile.tracksWebsite && !(isEarly && rng() < 0.5);

    months.push({
      storeId: profile.store.id,
      yearMonth,
      revenue,
      acquisition: genAcquisition(quality, rng),
      repeat: genRepeat(quality, rng),
      googleBusiness,
      website: includeWebsite ? genWebsite(quality, m, rng) : undefined,
      sns: genSns(quality, m, profile.hasTiktok, rng),
      recruiting: includeRecruiting ? genRecruiting(quality, rng) : undefined,
      retention: genRetention(quality, profile.store.staffCount, rng),
      productivity: genProductivity(quality, profile.store.staffCount, revenue, rng),
      brand: genBrand(quality, googleBusiness.averageRating, rng),
      management: genManagement(quality, rng),
      basicSnapshot: {
        staffCount: profile.store.staffCount,
        averageUnitPrice: revenue.averageUnitPrice,
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return months;
}

const STORE_PROFILES = buildStoreProfiles();

export const SEED_STORES: Store[] = STORE_PROFILES.map((p) => p.store);

export const SEED_MONTHLY_METRICS: Record<string, MonthlyMetrics[]> = Object.fromEntries(
  STORE_PROFILES.map((profile) => [profile.store.id, buildMonthlyMetricsForStore(profile)])
);
