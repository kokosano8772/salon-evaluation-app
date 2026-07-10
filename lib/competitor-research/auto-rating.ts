// 数値・はい/いいえ項目は自社の値と競合の値を機械的に比較できるため、
// 比較開始時に自動で評価（good/normal/bad）を確定させる。
// 自由記述項目は客観的な比較ができないため対象外（未評価のまま、手動評価に委ねる）。
// 自動で入った評価も、既存の手動評価メニューでいつでも上書きできる。

import { ATTRACTION_FIELDS, RECRUITMENT_FIELDS } from "./types";
import { AnalysisMode, CellRating, ComparisonData, ComparisonField, SalonData } from "./types";
import { getFieldDisplayValue, getFieldRawValue } from "./field-value";

function toComparable(raw: unknown): number | undefined {
  if (typeof raw === "boolean") return raw ? 1 : 0;
  if (typeof raw === "number") return raw;
  return undefined;
}

// ratingは「競合が自社と比べてどうか」を表す（good=競合が優位、bad=自社が優位）。
function compareToRating(ownValue: number, competitorValue: number): CellRating {
  if (competitorValue > ownValue) return "good";
  if (competitorValue < ownValue) return "bad";
  return "normal";
}

export function computeAutoCellData(salons: SalonData[], mode: AnalysisMode): ComparisonData {
  const own = salons.find((s) => s.isOwn);
  if (!own) return {};

  const fields: ComparisonField[] = [
    ...(mode !== "recruitment" ? ATTRACTION_FIELDS : []),
    ...(mode !== "attraction" ? RECRUITMENT_FIELDS : []),
  ].filter((f) => f.type === "number" || f.type === "boolean");

  const result: ComparisonData = {};

  for (const salon of salons) {
    if (salon.isOwn) continue;
    for (const field of fields) {
      const ownValue = toComparable(getFieldRawValue(own, field));
      const competitorValue = toComparable(getFieldRawValue(salon, field));
      // 自社側にデータがない項目は公平に比較できないため自動判定しない
      if (ownValue === undefined || competitorValue === undefined) continue;

      if (!result[salon.id]) result[salon.id] = {};
      result[salon.id][field.key] = {
        value: getFieldDisplayValue(salon, field),
        rating: compareToRating(ownValue, competitorValue),
      };
    }
  }

  return result;
}
