// APIキー未設定時のモックフォールバック。「salon investigation-app」の
// src/lib/mock/salons.ts から移植。

import type { SalonBasic, SalonGenre } from "./types";

interface MockSalonTemplate {
  name: string;
  genre: SalonGenre;
  rating: number;
  reviewCount: number;
  area: string;
  address: string;
  website?: string;
}

// Base templates — region prefix is injected at query time
const TEMPLATES: MockSalonTemplate[] = [
  { name: "HAIR SALON LUXE", genre: "hair", rating: 4.8, reviewCount: 312, area: "栄エリア", address: "中区栄3-5-10 プラザビル2F" },
  { name: "Nail Studio FLORA", genre: "nail", rating: 4.6, reviewCount: 187, area: "栄エリア", address: "中区栄2-8-15 グランドビル3F" },
  { name: "Eyelash Salon BLOOM", genre: "eyelash", rating: 4.7, reviewCount: 243, area: "栄エリア", address: "中区栄4-1-20 セントラルプラザ4F" },
  { name: "Beauty Salon COCO", genre: "hair", rating: 4.3, reviewCount: 98, area: "中心部", address: "中区1-2-3 コーポA 1F" },
  { name: "Nail & Eyelash PRISM", genre: "total_beauty", rating: 4.5, reviewCount: 156, area: "中心部", address: "中区1-3-7 ビル5F" },
  { name: "HAIR DESIGN ARTE", genre: "hair", rating: 4.4, reviewCount: 201, area: "郊外", address: "北区2-10-5 テナントビル2F" },
  { name: "Lash & Nail GRACE", genre: "total_beauty", rating: 4.9, reviewCount: 421, area: "中心部", address: "中区3-4-12 ビル6F", website: "https://example.com" },
  { name: "SALON du PARIS", genre: "hair", rating: 4.2, reviewCount: 75, area: "郊外", address: "中区4-5-8 ハイツ1F" },
  { name: "Eye Lash MIEL", genre: "eyelash", rating: 4.6, reviewCount: 134, area: "中心部", address: "熱田区2-1-9 ビル3F" },
  { name: "Nail Atelier LUNA", genre: "nail", rating: 4.8, reviewCount: 289, area: "中心部", address: "中区5-2-18 タワービル7F" },
  { name: "CUT&COLOR TRIBE", genre: "hair", rating: 4.1, reviewCount: 62, area: "郊外", address: "昭和区1-3-4 マンション1F" },
  { name: "Eyelash VEIL", genre: "eyelash", rating: 4.5, reviewCount: 178, area: "中心部", address: "中区2-6-11 商業ビル4F" },
  { name: "Nail Room MOCA", genre: "nail", rating: 4.3, reviewCount: 103, area: "住宅地", address: "千種区3-2-7 一軒家" },
  { name: "HAIR COLOR STUDIO mod", genre: "hair", rating: 4.7, reviewCount: 334, area: "中心部", address: "中区1-9-2 ビル3F" },
  { name: "Total Beauty RAFINE", genre: "total_beauty", rating: 4.0, reviewCount: 45, area: "郊外", address: "守山区4-1-15 テナント" },
  { name: "Lash & Brow PETAL", genre: "eyelash", rating: 4.8, reviewCount: 267, area: "中心部", address: "東区2-8-3 ビル2F" },
  { name: "NAIL ART CACHE", genre: "nail", rating: 4.4, reviewCount: 121, area: "中心部", address: "中区6-3-9 雑居ビル4F" },
  { name: "AVANTE hair studio", genre: "hair", rating: 3.9, reviewCount: 38, area: "住宅地", address: "瑞穂区1-7-2 1F" },
  { name: "BONHEUR nail & lash", genre: "total_beauty", rating: 4.6, reviewCount: 198, area: "中心部", address: "中区3-1-4 ハイビル5F" },
  { name: "Studio ÉCLAT", genre: "hair", rating: 4.5, reviewCount: 156, area: "中心部", address: "中区4-7-1 セレクトビル3F" },
];

// Deterministic shuffle by seed so same region always yields same order
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return [...arr].sort(() => {
    h = (Math.imul(h, 1664525) + 1013904223) | 0;
    return (h & 1) ? 1 : -1;
  });
}

export function getMockSalons(
  region: string,
  genre?: SalonGenre | "all",
  sortBy?: "rating" | "reviews" | "distance",
  page = 1,
  perPage = 20
): { salons: SalonBasic[]; total: number; hasMore: boolean } {
  const shuffled = seededShuffle(TEMPLATES, region);

  const filtered = shuffled
    .filter((t) => !genre || genre === "all" || t.genre === genre)
    .map((t, i) => ({
      id: `mock_${region}_${i}`,
      name: t.name,
      genre: t.genre,
      rating: t.rating,
      reviewCount: t.reviewCount,
      area: `${region} ${t.area}`,
      address: `${region.replace(/市$/, "")}市${t.address}`,
      website: t.website,
      imageUrl: undefined,
    }));

  if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);
  else if (sortBy === "reviews") filtered.sort((a, b) => b.reviewCount - a.reviewCount);

  const start = (page - 1) * perPage;
  return {
    salons: filtered.slice(start, start + perPage),
    total: filtered.length,
    hasMore: start + perPage < filtered.length,
  };
}
