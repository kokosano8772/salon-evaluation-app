// プロバイダの優先順位制御。「salon investigation-app」の
// src/lib/api/search-service.ts から移植。
// Provider priority: Google → HotPepper → Mock
// Falls back automatically when an API key is missing or the call fails

import type { SearchRequest, SearchResponse } from "./search-types";
import { SearchError } from "./search-types";
import { HotPepperProvider } from "./hotpepper";
import { GooglePlacesProvider } from "./google-places";
import { getMockSalons } from "./mock-salons";

function buildProviders() {
  const providers = [];

  const googleKey = process.env.GOOGLE_PLACES_API_KEY ?? "";
  if (googleKey) providers.push(new GooglePlacesProvider(googleKey));

  const hotpepperKey = process.env.HOTPEPPER_API_KEY ?? "";
  if (hotpepperKey) providers.push(new HotPepperProvider(hotpepperKey));

  return providers;
}

export async function searchSalons(req: SearchRequest): Promise<SearchResponse> {
  const providers = buildProviders();

  for (const provider of providers) {
    if (!provider.isAvailable()) continue;
    try {
      const result = await provider.search(req);
      if (result.salons.length > 0) return result;
    } catch (err) {
      // Rate limit → stop trying more providers to avoid further charges
      if (err instanceof SearchError && err.code === "RATE_LIMIT") {
        console.warn(`[CompetitorSearch] Rate limited on ${err.provider}, falling back`);
        break;
      }
      console.warn(`[CompetitorSearch] Provider failed:`, err);
      // Try next provider
    }
  }

  // Mock fallback
  const { salons, total, hasMore } = getMockSalons(
    req.region,
    req.genre,
    req.sortBy,
    req.page,
    req.perPage
  );

  return {
    salons,
    total,
    page: req.page ?? 1,
    perPage: req.perPage ?? 20,
    hasMore,
    source: "mock",
  };
}
