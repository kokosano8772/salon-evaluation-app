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
//
// 比較表は<table>ではなくCSS Grid(div)で組む。html-to-imageはDOMをSVGの
// foreignObject経由でラスタライズしており、table-layout:fixed+colgroupの
// 組み合わせはforeignObject内でのレイアウト解決がブラウザによって不安定になる
// ことが知られている(実際に一部環境で右側の列が丸ごと描画されず、残った列が
// 間延びして見える不具合が発生した)。CSS Gridなら各セルの幅をgrid-template-
// columnsで直接指定でき、table特有のレイアウトアルゴリズムを経由しないため
// この種の不具合を避けられる。
export default function CompetitorPrintDocument({ salons, mode, cellData, region, aiResult }: CompetitorPrintDocumentProps) {
  const { headers, rows } = buildExportData(salons, mode, cellData);

  const modeLabel = mode === "attraction" ? "集客分析" : mode === "recruitment" ? "求人分析" : "集客・求人分析";
  const date = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  const DOC_WIDTH = 1800;
  const DOC_PADDING = 16;
  const TABLE_WIDTH = DOC_WIDTH - DOC_PADDING * 2;

  const colCount = headers.length;
  const categoryColWidth = Math.round(TABLE_WIDTH * 0.08);
  const fieldColWidth = Math.round(TABLE_WIDTH * 0.18);
  const salonColWidth = Math.floor((TABLE_WIDTH - categoryColWidth - fieldColWidth) / (colCount - 2));
  const colWidths = [categoryColWidth, fieldColWidth, ...Array(colCount - 2).fill(salonColWidth)];
  const gridTemplateColumns = colWidths.map((w) => `${w}px`).join(" ");

  let prevCategory = "";

  return (
    <div
      style={{
        width: DOC_WIDTH,
        fontFamily: '"Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif',
        fontSize: 9,
        color: "#111827",
        background: "#fff",
        padding: DOC_PADDING,
      }}
    >
      <h1 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>競合分析レポート — {region}</h1>
      <p style={{ color: "#6b7280", fontSize: 9, marginBottom: 16 }}>
        {modeLabel} ／ 出力日: {date} ／ 比較: {salons.filter((s) => !s.isOwn).length}社
      </p>

      <div role="table" style={{ display: "grid", gridTemplateColumns, width: TABLE_WIDTH }}>
        <div role="row" data-print-section style={{ display: "contents" }}>
          {headers.map((h, i) => (
            <div
              role="columnheader"
              key={h + i}
              style={{
                background: ACCENT,
                color: "#fff",
                padding: "5px 6px",
                fontSize: 9,
                textAlign: "left",
                border: `1px solid ${ACCENT_DARK}`,
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {rows.map((r, ri) => {
          const catChanged = r.category !== prevCategory;
          prevCategory = r.category;
          const catBg = r.category === "集客分析" ? "#fdf2f5" : "#faf5ff";
          const rowBg = ri % 2 === 1 ? "#f9fafb" : "#fff";
          return (
            <div role="row" data-print-section key={ri} style={{ display: "contents" }}>
              <div
                role="cell"
                style={{
                  background: catBg,
                  color: "#6b7280",
                  fontSize: 8,
                  textAlign: "center",
                  border: "1px solid #e5e7eb",
                  padding: "3px 5px",
                }}
              >
                {catChanged ? r.category : ""}
              </div>
              <div
                role="cell"
                style={{ background: rowBg, fontSize: 9, fontWeight: 600, border: "1px solid #e5e7eb", padding: "3px 5px" }}
              >
                {r.field}
              </div>
              {r.values.map((v, i) => (
                <div
                  role="cell"
                  key={i}
                  style={{
                    fontSize: 9,
                    background: i === 0 ? "#fdf2f5" : rowBg,
                    border: "1px solid #e5e7eb",
                    padding: "3px 5px",
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {v}
                </div>
              ))}
            </div>
          );
        })}
      </div>

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
