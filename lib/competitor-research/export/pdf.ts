// PDF出力（ブラウザ印刷方式）。「salon investigation-app」の
// src/lib/export/pdf.ts から移植。アクセントカラーのみアプリのrose(#C4788A)に変更。

import { buildExportData } from "./build-table-data";
import type { SalonData, AnalysisMode, ComparisonData } from "../types";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r?\n/g, "<br>");
}

export function exportToPdf(
  salons: SalonData[],
  mode: AnalysisMode,
  cellData: ComparisonData,
  region: string,
  aiResult?: string
): void {
  const { headers, rows } = buildExportData(salons, mode, cellData);

  const modeLabel =
    mode === "attraction" ? "集客分析" :
    mode === "recruitment" ? "求人分析" :
    "集客・求人分析";

  const date = new Date().toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric",
  });

  const colCount = headers.length;
  const salonColWidth = Math.floor(70 / (colCount - 2));

  const headerRow = headers
    .map((h, i) =>
      i === 0
        ? `<th style="width:8%">${esc(h)}</th>`
        : i === 1
        ? `<th style="width:18%">${esc(h)}</th>`
        : `<th style="width:${salonColWidth}%">${esc(h)}</th>`
    )
    .join("");

  let prevCategory = "";
  const bodyRows = rows
    .map((r) => {
      const catChanged = r.category !== prevCategory;
      prevCategory = r.category;
      const catBg = r.category === "集客分析"
        ? "background:#fdf2f5"
        : "background:#faf5ff";
      return `<tr>
        <td style="${catBg};color:#6b7280;font-size:8px;text-align:center">${catChanged ? esc(r.category) : ""}</td>
        <td style="font-weight:600">${esc(r.field)}</td>
        ${r.values.map((v, i) =>
          `<td style="${i === 0 ? "background:#fdf2f5" : ""}">${esc(v)}</td>`
        ).join("")}
      </tr>`;
    })
    .join("");

  const aiSection = aiResult
    ? `<div style="margin-top:24px;page-break-before:always">
        <h2 style="font-size:13px;margin-bottom:8px;color:#A85E74">AI 競合分析レポート</h2>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;white-space:pre-wrap;font-size:9px;line-height:1.7">
          ${esc(aiResult)}
        </div>
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>競合分析レポート — ${esc(region)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif;
    font-size: 9px;
    color: #111827;
    padding: 16px;
  }
  h1 { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
  .meta { color: #6b7280; font-size: 9px; margin-bottom: 12px; }
  table {
    border-collapse: collapse;
    width: 100%;
    table-layout: fixed;
  }
  thead tr th {
    background: #C4788A;
    color: #fff;
    padding: 5px 6px;
    font-size: 9px;
    text-align: left;
    border: 1px solid #A85E74;
  }
  tbody tr td {
    border: 1px solid #e5e7eb;
    padding: 3px 5px;
    vertical-align: top;
    word-break: break-all;
  }
  tbody tr:nth-child(even) td { background: #f9fafb; }
  @media print {
    @page { size: A4 landscape; margin: 8mm; }
    body { padding: 0; }
  }
</style>
</head>
<body>
<h1>競合分析レポート — ${esc(region)}</h1>
<div class="meta">${modeLabel} ／ 出力日: ${date} ／ 比較: ${salons.filter((s) => !s.isOwn).length}社</div>
<table>
  <thead><tr>${headerRow}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>
${aiSection}
</body>
</html>`;

  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) {
    alert("ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。");
    return;
  }
  win.document.write(html);
  win.document.close();
  // Give browser time to render Japanese fonts before triggering print
  win.setTimeout(() => win.print(), 600);
}
