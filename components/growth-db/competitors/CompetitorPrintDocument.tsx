import { buildExportData } from "@/lib/competitor-research/export/build-table-data";
import { AnalysisMode, ComparisonData, SalonData } from "@/lib/competitor-research/types";

interface CompetitorPrintDocumentProps {
  salons: SalonData[];
  mode: AnalysisMode;
  cellData: ComparisonData;
  region: string;
  aiResult?: string;
}

const ACCENT = "#C4788A";
const ACCENT_DARK = "#A85E74";

// ブラウザの印刷ダイアログ(window.print())経由だと、用紙サイズ・余白・
// 背景グラフィックの設定次第で画面に見えてる内容と仕上がりが食い違っていた
// （特に背景色が消える／列幅が画面より狭くなる）。lib/pdf.tsのexportResultToPDF
// （html-to-image + jsPDF、印刷ダイアログを一切経由しない）でこの非表示DOMを
// そのままキャプチャすることで、画面表示と完全に同じ見た目でPDF化する。
export default function CompetitorPrintDocument({ salons, mode, cellData, region, aiResult }: CompetitorPrintDocumentProps) {
  const { headers, rows } = buildExportData(salons, mode, cellData);

  const modeLabel = mode === "attraction" ? "集客分析" : mode === "recruitment" ? "求人分析" : "集客・求人分析";
  const date = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  const colCount = headers.length;
  const salonColWidthPct = Math.floor(70 / (colCount - 2));

  let prevCategory = "";

  return (
    <div
      style={{
        width: 1800,
        fontFamily: '"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif',
        fontSize: 9,
        color: "#111827",
        background: "#fff",
        padding: 16,
      }}
    >
      <h1 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>競合分析レポート — {region}</h1>
      <p style={{ color: "#6b7280", fontSize: 9, marginBottom: 16 }}>
        {modeLabel} ／ 出力日: {date} ／ 比較: {salons.filter((s) => !s.isOwn).length}社
      </p>

      <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
        <thead>
          <tr data-print-section>
            {headers.map((h, i) => (
              <th
                key={h + i}
                style={{
                  width: i === 0 ? "8%" : i === 1 ? "18%" : `${salonColWidthPct}%`,
                  background: ACCENT,
                  color: "#fff",
                  padding: "5px 6px",
                  fontSize: 9,
                  textAlign: "left",
                  border: `1px solid ${ACCENT_DARK}`,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => {
            const catChanged = r.category !== prevCategory;
            prevCategory = r.category;
            const catBg = r.category === "集客分析" ? "#fdf2f5" : "#faf5ff";
            return (
              <tr data-print-section key={ri} style={{ background: ri % 2 === 1 ? "#f9fafb" : undefined }}>
                <td style={{ background: catBg, color: "#6b7280", fontSize: 8, textAlign: "center", border: "1px solid #e5e7eb", padding: "3px 5px", verticalAlign: "top" }}>
                  {catChanged ? r.category : ""}
                </td>
                <td style={{ fontSize: 9, fontWeight: 600, border: "1px solid #e5e7eb", padding: "3px 5px", verticalAlign: "top" }}>{r.field}</td>
                {r.values.map((v, i) => (
                  <td
                    key={i}
                    style={{
                      fontSize: 9,
                      background: i === 0 ? "#fdf2f5" : undefined,
                      border: "1px solid #e5e7eb",
                      padding: "3px 5px",
                      verticalAlign: "top",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {aiResult && (
        <div data-print-section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 13, marginBottom: 8, color: ACCENT_DARK }}>AI 競合分析レポート</h2>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: 12, whiteSpace: "pre-wrap", fontSize: 9, lineHeight: 1.7 }}>
            {aiResult}
          </div>
        </div>
      )}
    </div>
  );
}
