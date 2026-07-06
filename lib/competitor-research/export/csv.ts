// CSV出力。「salon investigation-app」の src/lib/export/csv.ts から移植。

import { buildExportData } from "./build-table-data";
import type { SalonData, AnalysisMode, ComparisonData } from "../types";

function esc(v: string): string {
  return `"${v.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

export function exportToCsv(
  salons: SalonData[],
  mode: AnalysisMode,
  cellData: ComparisonData,
  region: string
): void {
  const { headers, rows } = buildExportData(salons, mode, cellData);

  const lines = [
    headers.map(esc).join(","),
    ...rows.map((r) =>
      [r.category, r.field, ...r.values].map(esc).join(",")
    ),
  ];

  // UTF-8 BOM — required for Windows Excel to open Japanese correctly
  const blob = new Blob(["﻿" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `競合分析_${region}_${date}.csv`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
