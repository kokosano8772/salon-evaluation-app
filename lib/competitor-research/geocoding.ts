// 地域名→緯度経度変換。「salon investigation-app」の src/lib/api/geocoding.ts から移植。

import type { LatLng } from "./search-types";

// Static lookup for common Japanese cities/areas to avoid Geocoding API calls for known regions
const REGION_LOOKUP: Record<string, LatLng> = {
  // 愛知
  名古屋市: { lat: 35.1815, lng: 136.9066 },
  名古屋: { lat: 35.1815, lng: 136.9066 },
  栄: { lat: 35.1706, lng: 136.9089 },
  金山: { lat: 35.1431, lng: 136.9056 },
  大須: { lat: 35.1613, lng: 136.9013 },
  矢場町: { lat: 35.1645, lng: 136.9050 },
  伏見: { lat: 35.1697, lng: 136.8993 },
  岡崎市: { lat: 34.9557, lng: 137.1750 },
  豊田市: { lat: 35.0836, lng: 137.1562 },
  一宮市: { lat: 35.3036, lng: 136.8003 },
  刈谷市: { lat: 34.9886, lng: 136.9929 },
  春日井市: { lat: 35.2333, lng: 136.9719 },
  豊橋市: { lat: 34.7693, lng: 137.3916 },
  // 大阪
  大阪市: { lat: 34.6937, lng: 135.5022 },
  梅田: { lat: 34.7024, lng: 135.4959 },
  難波: { lat: 34.6644, lng: 135.5013 },
  心斎橋: { lat: 34.6739, lng: 135.5014 },
  天王寺: { lat: 34.6464, lng: 135.5132 },
  // 東京
  東京都: { lat: 35.6762, lng: 139.6503 },
  東京: { lat: 35.6762, lng: 139.6503 },
  渋谷: { lat: 35.6595, lng: 139.7004 },
  新宿: { lat: 35.6938, lng: 139.7034 },
  銀座: { lat: 35.6717, lng: 139.7650 },
  池袋: { lat: 35.7295, lng: 139.7109 },
  原宿: { lat: 35.6699, lng: 139.7027 },
  表参道: { lat: 35.6658, lng: 139.7120 },
  // 神奈川
  横浜市: { lat: 35.4437, lng: 139.6380 },
  横浜: { lat: 35.4437, lng: 139.6380 },
  // 愛知その他
  長久手市: { lat: 35.1864, lng: 137.0432 },
  日進市: { lat: 35.1360, lng: 137.0295 },
  尾張旭市: { lat: 35.2147, lng: 137.0366 },
};

export async function geocodeRegion(region: string): Promise<LatLng | null> {
  // Check static lookup first (trimmed, partial match)
  const trimmed = region.trim();
  for (const [key, coords] of Object.entries(REGION_LOOKUP)) {
    if (trimmed === key || trimmed.includes(key) || key.includes(trimmed)) {
      return coords;
    }
  }

  // Fall back to Google Geocoding API if key available
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", `${region} 日本`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", "ja");

    const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
  } catch {
    // Geocoding is optional; proceed without coordinates
  }

  return null;
}
