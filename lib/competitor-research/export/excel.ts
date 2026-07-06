// Excel出力。「salon investigation-app」の src/lib/export/excel.ts から移植。

import { buildExportData } from "./build-table-data";
import type { SalonData, AnalysisMode, ComparisonData } from "../types";

export async function exportToExcel(
  salons: SalonData[],
  mode: AnalysisMode,
  cellData: ComparisonData,
  region: string
): Promise<void> {
  // Dynamic import — keeps xlsx out of the initial bundle
  const XLSX = await import("xlsx");

  const { headers, rows } = buildExportData(salons, mode, cellData);

  const wsData = [
    headers,
    ...rows.map((r) => [r.category, r.field, ...r.values]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [
    { wch: 10 },
    { wch: 22 },
    ...salons.map(() => ({ wch: 28 })),
  ];

  // Freeze header row
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "競合分析");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `競合分析_${region}_${date}.xlsx`);
}
