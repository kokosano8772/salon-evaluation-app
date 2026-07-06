// エクスポート用の共通テーブルデータ組み立て。「salon investigation-app」の
// src/lib/export/buildTableData.ts から移植。

import { ATTRACTION_FIELDS, RECRUITMENT_FIELDS } from "../types";
import type { SalonData, AnalysisMode, ComparisonField, ComparisonData } from "../types";

function getVal(
  salon: SalonData,
  field: ComparisonField,
  cellData: ComparisonData
): string {
  const edited = cellData[salon.id]?.[field.key]?.value;
  if (edited !== undefined && edited !== "") return edited;

  const src = field.category === "attraction" ? salon.attraction : salon.recruitment;
  if (!src) return "";
  const raw = (src as Record<string, unknown>)[field.key];
  if (raw === undefined || raw === null) return "";
  if (Array.isArray(raw)) return (raw as string[]).filter(Boolean).join("、");
  if (typeof raw === "boolean") return raw ? "あり" : "なし";
  if (typeof raw === "number") return raw === 0 ? "" : String(raw);
  return String(raw);
}

export interface ExportRow {
  category: string;
  field: string;
  values: string[];
}

export interface ExportData {
  headers: string[];
  rows: ExportRow[];
  salons: SalonData[];
}

export function buildExportData(
  salons: SalonData[],
  mode: AnalysisMode,
  cellData: ComparisonData
): ExportData {
  const fields = [
    ...(mode !== "recruitment" ? ATTRACTION_FIELDS : []),
    ...(mode !== "attraction" ? RECRUITMENT_FIELDS : []),
  ];

  const headers = [
    "カテゴリ",
    "項目",
    ...salons.map((s) => (s.isOwn ? "自社" : s.name)),
  ];

  const rows = fields.map((f) => ({
    category: f.category === "attraction" ? "集客分析" : "求人分析",
    field: f.label,
    values: salons.map((s) => getVal(s, f, cellData)),
  }));

  return { headers, rows, salons };
}
