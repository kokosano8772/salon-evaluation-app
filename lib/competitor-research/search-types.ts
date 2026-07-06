// 検索プロバイダ関連の型。「salon investigation-app」の src/lib/api/types.ts から移植。

import type { SalonBasic, SalonGenre, AnalysisMode } from "./types";

export interface SearchRequest {
  region: string;
  mode: AnalysisMode;
  genre?: SalonGenre | "all";
  sortBy?: "rating" | "reviews" | "distance";
  page?: number;
  perPage?: number;
}

export interface SearchResponse {
  salons: SalonBasic[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
  source: "hotpepper" | "google" | "mock";
}

export interface SearchProvider {
  search(req: SearchRequest): Promise<SearchResponse>;
  isAvailable(): boolean;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface HotPepperSalon {
  id: string;
  name: string;
  name_kana: string;
  address: string;
  station_name: string;
  ktai_coupon: number;
  large_service_area: { code: string; name: string };
  service_area: { code: string; name: string };
  middle_area: { code: string; name: string };
  small_area: { code: string; name: string };
  lat: string;
  lng: string;
  genre: { code: string; name: string; catch: string };
  sub_genre?: { code: string; name: string };
  logo_image: string;
  photo: {
    pc: { l: string; m: string; s: string };
    mobile: { l: string; s: string };
  };
  open: string;
  close: string;
  urls: { pc: string };
  budget: { code: string; name: string; average: string };
  budget_memo: string;
  capacity: number;
  access: string;
  mobile_access: string;
  catch: string;
  desc: string;
  coupon_urls: { pc: string; sp: string };
}

export interface HotPepperResponse {
  results: {
    api_version: string;
    results_available: number;
    results_returned: string;
    results_start: number;
    salon: HotPepperSalon[];
  };
}

export interface GooglePlace {
  id: string;
  displayName: { text: string; languageCode: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  regularOpeningHours?: {
    openNow: boolean;
    weekdayDescriptions: string[];
  };
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
    authorAttributions: Array<{ displayName: string; uri: string; photoUri: string }>;
  }>;
  priceLevel?: "PRICE_LEVEL_FREE" | "PRICE_LEVEL_INEXPENSIVE" | "PRICE_LEVEL_MODERATE" | "PRICE_LEVEL_EXPENSIVE" | "PRICE_LEVEL_VERY_EXPENSIVE";
  businessStatus?: "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY";
  shortFormattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
}

export interface GooglePlacesResponse {
  places: GooglePlace[];
  nextPageToken?: string;
}

export class SearchError extends Error {
  constructor(
    message: string,
    public readonly code: "API_ERROR" | "RATE_LIMIT" | "NO_RESULTS" | "NETWORK_ERROR",
    public readonly provider?: string
  ) {
    super(message);
    this.name = "SearchError";
  }
}
