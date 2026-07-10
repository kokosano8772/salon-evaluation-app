// Google Places APIによる競合検索。「salon investigation-app」の
// src/lib/api/google-places.ts から移植。

import type { SalonBasic, SalonGenre } from "./types";
import type {
  SearchProvider,
  SearchRequest,
  SearchResponse,
  GooglePlace,
  GooglePlacesResponse,
  LatLng,
} from "./search-types";
import { SearchError } from "./search-types";
import { geocodeRegion } from "./geocoding";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.regularOpeningHours",
  "places.nationalPhoneNumber",
  "places.photos",
  "places.priceLevel",
  "places.businessStatus",
].join(",");

// Maps genre to search keyword appended to region
const GENRE_KEYWORDS: Record<SalonGenre | "all", string[]> = {
  hair: ["美容室", "ヘアサロン", "美容院"],
  eyelash: ["アイラッシュサロン", "まつ毛エクステ"],
  nail: ["ネイルサロン"],
  total_beauty: ["トータルビューティーサロン"],
  other: ["サロン"],
  all: ["美容室", "ネイルサロン", "アイラッシュサロン"],
};

function inferGenre(displayName: string): SalonGenre {
  const n = displayName.toLowerCase();
  if (n.includes("nail") || n.includes("ネイル")) return "nail";
  if (n.includes("lash") || n.includes("まつ") || n.includes("アイ")) return "eyelash";
  return "hair";
}

// Google Placesの weekdayDescriptions（例:「月曜日: 10:00～19:00」「火曜日: 定休日」）から
// 営業時間・定休日の目安テキストを組み立てる。曜日ごとに時間が違う場合は最頻値を営業時間として採用する。
function parseOpeningHours(weekdayDescriptions?: string[]): { businessHours?: string; closedDays?: string } {
  if (!weekdayDescriptions || weekdayDescriptions.length === 0) return {};

  const closedDayNames: string[] = [];
  const hoursCount = new Map<string, number>();

  for (const line of weekdayDescriptions) {
    const [dayPart, ...rest] = line.split(":");
    const timePart = rest.join(":").trim();
    if (!timePart) continue;
    if (timePart.includes("定休日") || timePart.includes("休業")) {
      closedDayNames.push(dayPart.trim());
    } else {
      hoursCount.set(timePart, (hoursCount.get(timePart) ?? 0) + 1);
    }
  }

  let businessHours: string | undefined;
  let maxCount = 0;
  for (const [hours, count] of hoursCount) {
    if (count > maxCount) {
      maxCount = count;
      businessHours = hours;
    }
  }

  return {
    businessHours,
    closedDays: closedDayNames.length > 0 ? closedDayNames.join("・") : undefined,
  };
}

function mapPlace(place: GooglePlace, apiKey: string): SalonBasic {
  const photoRef = place.photos?.[0]?.name;
  const imageUrl = photoRef
    ? `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=400&key=${apiKey}`
    : undefined;
  const { businessHours, closedDays } = parseOpeningHours(place.regularOpeningHours?.weekdayDescriptions);

  return {
    id: `gp_${place.id}`,
    name: place.displayName.text,
    area: place.shortFormattedAddress ?? place.formattedAddress,
    genre: inferGenre(place.displayName.text),
    rating: place.rating ?? 0,
    reviewCount: place.userRatingCount ?? 0,
    address: place.formattedAddress,
    phone: place.nationalPhoneNumber,
    businessHours,
    closedDays,
    website: place.websiteUri,
    imageUrl,
  };
}

export class GooglePlacesProvider implements SearchProvider {
  private readonly baseUrl = "https://places.googleapis.com/v1/places:searchText";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  async search(req: SearchRequest): Promise<SearchResponse> {
    const genre = req.genre ?? "all";
    const keywords = GENRE_KEYWORDS[genre];

    // Run parallel searches for each keyword, then deduplicate by id
    let coords: LatLng | null = null;
    try {
      coords = await geocodeRegion(req.region);
    } catch {
      // Proceed without location bias
    }

    const allPlaces: GooglePlace[] = [];
    const seenIds = new Set<string>();

    await Promise.allSettled(
      keywords.map(async (keyword) => {
        const body: Record<string, unknown> = {
          textQuery: `${req.region} ${keyword}`,
          languageCode: "ja",
          maxResultCount: 20,
        };

        if (coords) {
          body.locationBias = {
            circle: {
              center: { latitude: coords.lat, longitude: coords.lng },
              radius: 5000,
            },
          };
        }

        const res = await fetch(this.baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": this.apiKey,
            "X-Goog-FieldMask": FIELD_MASK,
          },
          body: JSON.stringify(body),
          next: { revalidate: 300 },
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new SearchError(
            `Google Places API error ${res.status}: ${errText}`,
            res.status === 429 ? "RATE_LIMIT" : "API_ERROR",
            "google"
          );
        }

        const data: GooglePlacesResponse = await res.json();
        for (const place of data.places ?? []) {
          if (
            !seenIds.has(place.id) &&
            place.businessStatus !== "CLOSED_PERMANENTLY"
          ) {
            seenIds.add(place.id);
            allPlaces.push(place);
          }
        }
      })
    );

    // Sort by requested order
    let sorted = [...allPlaces];
    if (req.sortBy === "rating") {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (req.sortBy === "reviews") {
      sorted.sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0));
    }

    // Paginate client-side (Places API doesn't support true pagination for text search)
    const perPage = req.perPage ?? 20;
    const page = req.page ?? 1;
    const start = (page - 1) * perPage;
    const pageSlice = sorted.slice(start, start + perPage);

    return {
      salons: pageSlice.map((p) => mapPlace(p, this.apiKey)),
      total: sorted.length,
      page,
      perPage,
      hasMore: start + perPage < sorted.length,
      source: "google",
    };
  }
}
