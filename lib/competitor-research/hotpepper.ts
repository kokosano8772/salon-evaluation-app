// HotPepper Beauty APIによる競合検索。「salon investigation-app」の
// src/lib/api/hotpepper.ts から移植。

import type { SalonBasic, SalonGenre } from "./types";
import type {
  SearchProvider,
  SearchRequest,
  SearchResponse,
  HotPepperResponse,
  HotPepperSalon,
} from "./search-types";
import { SearchError } from "./search-types";

// HotPepper genre codes → SalonGenre
const GENRE_TO_CODE: Record<SalonGenre | "all", string> = {
  hair: "HL",
  nail: "HN",
  eyelash: "HE",
  total_beauty: "HL",
  other: "HL",
  all: "",
};

// HotPepper genre code → SalonGenre
const CODE_TO_GENRE: Record<string, SalonGenre> = {
  HL: "hair",
  HN: "nail",
  HE: "eyelash",
};

function mapSalon(s: HotPepperSalon): SalonBasic {
  return {
    id: `hp_${s.id}`,
    name: s.name,
    area: s.small_area?.name ?? s.middle_area?.name ?? s.service_area?.name ?? "",
    genre: CODE_TO_GENRE[s.genre?.code] ?? "other",
    rating: 0, // HotPepper doesn't expose ratings in free tier
    reviewCount: 0,
    address: s.address,
    phone: undefined,
    website: s.urls?.pc,
    hotpepperUrl: s.urls?.pc,
    imageUrl: s.photo?.pc?.l || s.logo_image || undefined,
  };
}

export class HotPepperProvider implements SearchProvider {
  private readonly baseUrl = "https://webservice.recruit.co.jp/hotpepper/salon/v1/";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  async search(req: SearchRequest): Promise<SearchResponse> {
    const perPage = req.perPage ?? 20;
    const start = ((req.page ?? 1) - 1) * perPage + 1;

    const params = new URLSearchParams({
      key: this.apiKey,
      keyword: req.region,
      count: String(perPage),
      start: String(start),
      format: "json",
    });

    const genreCode = req.genre && req.genre !== "all"
      ? GENRE_TO_CODE[req.genre]
      : "";
    if (genreCode) params.set("genre", genreCode);

    if (req.sortBy === "reviews") params.set("order", "4");
    else params.set("order", "3"); // default: recommended

    let data: HotPepperResponse;
    try {
      const res = await fetch(`${this.baseUrl}?${params.toString()}`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) {
        throw new SearchError(
          `HotPepper API error: ${res.status}`,
          "API_ERROR",
          "hotpepper"
        );
      }
      data = await res.json();
    } catch (err) {
      if (err instanceof SearchError) throw err;
      throw new SearchError("Network error", "NETWORK_ERROR", "hotpepper");
    }

    const results = data.results;
    const salons = (results.salon ?? []).map(mapSalon);

    return {
      salons,
      total: results.results_available,
      page: req.page ?? 1,
      perPage,
      hasMore: start + salons.length - 1 < results.results_available,
      source: "hotpepper",
    };
  }
}
