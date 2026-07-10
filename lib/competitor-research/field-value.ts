// 比較表のセル表示値を取得する共通ロジック。
// CompetitorComparisonTable（表示用の文字列化）と auto-rating（数値の生比較）の
// 両方から使う。

import { ComparisonField, SalonData } from "./types";

export function getFieldRawValue(salon: SalonData, field: ComparisonField): unknown {
  const src = field.category === "attraction" ? salon.attraction : salon.recruitment;
  if (!src) return undefined;
  return (src as Record<string, unknown>)[field.key];
}

export function getFieldDisplayValue(salon: SalonData, field: ComparisonField): string {
  const raw = getFieldRawValue(salon, field);
  if (raw === undefined || raw === null) return "";
  if (Array.isArray(raw)) return raw.join("、");
  if (typeof raw === "boolean") return raw ? "あり" : "なし";
  if (typeof raw === "number") return raw === 0 ? "" : String(raw);
  return String(raw);
}
