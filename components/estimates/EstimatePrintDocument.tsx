import { EstimateHeader, LineItem, groupByCategory } from "./types";

interface EstimatePrintDocumentProps {
  estimate: EstimateHeader;
  clientLabel: string;
  lineItems: LineItem[];
}

function yen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`;
}

const INK = "#1a1a1a";
const LINE = "#1a1a1a";

// mm指定の見本レイアウトを、このコンポーネント自身の640px幅の座標系に変換する係数。
// lib/pdf.tsのexportResultToPDFは、このdiv全体をキャプチャしたcanvasをA4の
// 幅（210mm）いっぱいに拡大して貼り付けるため、「640pxがA4の横幅」という前提で
// mm→px換算できる。
const PX_PER_MM = 640 / 210;
const mm = (v: number) => v * PX_PER_MM;

const SIDE_MARGIN = mm(21.5); // 左右余白 約21.5mm
const DETAIL_ROWS = 24; // 見出し行を除く明細表の行数（見本に合わせた固定数）
const HEADER_ROW_HEIGHT = mm(7.5);
const DETAIL_ROW_HEIGHT = mm(5.9);
const CELL_BORDER = `0.8px solid ${LINE}`;

// 摘要/数量/単価/金額の4列幅（内容幅167mmの中で、摘要が残り全部を取る）
const QTY_COL = mm(22);
const UNIT_PRICE_COL = mm(38);
const AMOUNT_COL = mm(38);

type Row =
  | { kind: "category"; label: string }
  | { kind: "item"; name: string; quantity: number; unit: string; unitPrice: number }
  | { kind: "desc"; text: string }
  | { kind: "discount"; label: string; amount: number }
  | { kind: "note"; text: string }
  | { kind: "blank" };

// 明細・補足・値引き・注意事項を24行固定のフラットな行リストに変換する。
// 足りない分は空行で埋め、見本と同じく最後まで罫線が途切れないようにする。
function buildRows(groups: { category: string; items: LineItem[] }[], notes: string): Row[] {
  const rows: Row[] = [];
  for (const group of groups) {
    rows.push({ kind: "category", label: group.category });
    for (const item of group.items) {
      rows.push({ kind: "item", name: item.name, quantity: item.quantity, unit: item.unit, unitPrice: item.unitPrice });
      for (const line of item.description ? item.description.split("\n") : []) {
        rows.push({ kind: "desc", text: line });
      }
      if (item.procurementCost > 0) {
        rows.push({ kind: "desc", text: `仕入れ料金 ${yen(item.procurementCost)}` });
      }
      if (item.discountAmount > 0) {
        rows.push({ kind: "discount", label: item.discountLabel, amount: item.discountAmount });
      }
    }
  }
  for (const line of notes ? notes.split("\n") : []) {
    rows.push({ kind: "note", text: line });
  }
  while (rows.length < DETAIL_ROWS) rows.push({ kind: "blank" });
  return rows;
}

// PDF保存専用の静止レイアウト。/result のDiagnosisPrintDocumentと同じ方式
// （lib/pdf.tsのexportResultToPDF、html-to-image+jsPDFで高さを切り分ける）を踏襲する。
// デザインは実際にユーザーが使っている紙の見積書を、各要素の用紙上端からの距離・
// 行の高さ・列幅までmm単位で合わせている。数量は金額計算には使わない表記情報の
// ため、単価欄は参考として列だけ残し、値は入れない。
export default function EstimatePrintDocument({ estimate, clientLabel, lineItems }: EstimatePrintDocumentProps) {
  const groups = groupByCategory(lineItems);
  const rows = buildRows(groups, estimate.notes);

  const formatSlashDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };
  const issuedDateLabel = formatSlashDate(estimate.createdAt);
  const productionDateLabel = estimate.productionDate ? formatSlashDate(estimate.productionDate) : null;

  return (
    <div style={{ width: 640, backgroundColor: "white", fontFamily: "'Noto Sans JP', sans-serif", color: INK }}>
      {/* タイトルバー：用紙上端から19mm、高さ9mm */}
      <div data-print-section style={{ paddingTop: mm(19), paddingLeft: SIDE_MARGIN, paddingRight: SIDE_MARGIN }}>
        <div style={{ background: "#e5e5e5", height: mm(9), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.4em", margin: 0 }}>御見積書</h1>
        </div>

        {/* 見積番号・見積日（自社情報ブロックの上、右端に寄せすぎない） */}
        <div style={{ textAlign: "right", fontSize: 10.5, color: "#4b5563", marginTop: 10, lineHeight: 1.7 }}>
          <p style={{ margin: 0 }}>見積番号：</p>
          <p style={{ margin: 0 }}>見積日：{issuedDateLabel}</p>
        </div>

        {/* 宛先（下線なし）・ご担当 */}
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{clientLabel} 御中</p>
          <p style={{ fontSize: 11.5, margin: "4px 0 0" }}>ご担当　{estimate.clientContact || "　　　　"}　様</p>
        </div>

        {/* 件名等（左）・自社情報＋社印（右）。社印はTEL・担当者名の右側、下寄りに配置。 */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, gap: 20 }}>
          <div style={{ fontSize: 11, lineHeight: 1.75, minWidth: 0, flex: "1 1 auto" }}>
            <p style={{ margin: 0 }}>下記のとおり、御見積り申し上げます。</p>
            <p style={{ margin: 0 }}>件名：{estimate.title}</p>
            <p style={{ margin: 0 }}>納期：{productionDateLabel ?? ""}</p>
            <p style={{ margin: 0 }}>支払条件：</p>
            <p style={{ margin: 0 }}>有効期限：御見積後４週間</p>
          </div>
          <div style={{ display: "flex", flexShrink: 0 }}>
            <div style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.7, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: INK }}>株式会社　ココデザイン</p>
              <p style={{ margin: 0 }}>〒460-0012</p>
              <p style={{ margin: 0 }}>愛知県名古屋市中区千代田3丁目11-32 5F</p>
              <p style={{ margin: "6px 0 0" }}>TEL：090-1287-7557</p>
              {/* created_byはログイン時のメールアドレスのため、クライアント向けの
                  表記としては@より前の部分だけを担当者名として表示する。 */}
              <p style={{ margin: 0 }}>担当：{estimate.createdBy ? estimate.createdBy.split("@")[0] : ""}</p>
            </div>
            {/* 社印画像を貼る位置のスペース（実画像は未導入。TEL・担当者名の右、下寄りに配置） */}
            <div style={{ width: 44, height: 44, border: `0.8px solid ${LINE}`, marginLeft: 10, marginTop: 20, flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* 合計金額（強調）。用紙上端から100mm、高さ9mm、左端を明細表に揃える。 */}
      <div
        data-print-section
        style={{ marginTop: 10, paddingLeft: SIDE_MARGIN, paddingRight: SIDE_MARGIN }}
      >
        <div style={{ display: "inline-flex", alignItems: "stretch", height: mm(9), border: `0.8px solid ${INK}` }}>
          <div
            style={{
              background: "#e5e5e5",
              padding: "0 16px",
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              borderRight: `0.8px solid ${INK}`,
            }}
          >
            合計金額
          </div>
          <div style={{ padding: "0 16px", fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
            {yen(estimate.total)}
            <span style={{ fontSize: 10, fontWeight: 500, marginLeft: 6 }}>（税込）</span>
          </div>
        </div>
      </div>

      {/* 明細（24行固定の格子状の表）。見出し背景は白、4列は中央揃え。 */}
      <div style={{ marginTop: 7, paddingLeft: SIDE_MARGIN, paddingRight: SIDE_MARGIN }}>
        <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: 10.5 }}>
          <colgroup>
            <col />
            <col style={{ width: QTY_COL }} />
            <col style={{ width: UNIT_PRICE_COL }} />
            <col style={{ width: AMOUNT_COL }} />
          </colgroup>
          <thead>
            <tr style={{ height: HEADER_ROW_HEIGHT }}>
              <th style={{ textAlign: "center", fontWeight: 700, border: CELL_BORDER }}>摘要</th>
              <th style={{ textAlign: "center", fontWeight: 700, border: CELL_BORDER }}>数量</th>
              <th style={{ textAlign: "center", fontWeight: 700, border: CELL_BORDER }}>単価</th>
              <th style={{ textAlign: "center", fontWeight: 700, border: CELL_BORDER }}>金額</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const style = { height: DETAIL_ROW_HEIGHT };
              if (row.kind === "category") {
                return (
                  <tr key={i} data-print-section style={style}>
                    <td style={{ padding: "0 6px", fontWeight: 700, border: CELL_BORDER }}>●{row.label}</td>
                    <td style={{ border: CELL_BORDER }} />
                    <td style={{ border: CELL_BORDER }} />
                    <td style={{ border: CELL_BORDER }} />
                  </tr>
                );
              }
              if (row.kind === "item") {
                return (
                  <tr key={i} data-print-section style={style}>
                    <td style={{ padding: "0 6px", border: CELL_BORDER }}>・{row.name}</td>
                    <td style={{ padding: "0 4px", textAlign: "center", whiteSpace: "nowrap", border: CELL_BORDER }}>
                      {row.quantity}　{row.unit}
                    </td>
                    <td style={{ border: CELL_BORDER }} />
                    <td style={{ padding: "0 6px", textAlign: "right", fontWeight: 600, whiteSpace: "nowrap", border: CELL_BORDER }}>
                      {yen(row.unitPrice)}
                    </td>
                  </tr>
                );
              }
              if (row.kind === "desc") {
                return (
                  <tr key={i} data-print-section style={style}>
                    <td style={{ padding: "0 6px", fontSize: 9.5, color: "#4b5563", border: CELL_BORDER }}>　{row.text}</td>
                    <td style={{ border: CELL_BORDER }} />
                    <td style={{ border: CELL_BORDER }} />
                    <td style={{ border: CELL_BORDER }} />
                  </tr>
                );
              }
              if (row.kind === "discount") {
                return (
                  <tr key={i} data-print-section style={style}>
                    <td style={{ padding: "0 6px", color: "#dc2626", textAlign: "right", border: CELL_BORDER }}>{row.label}</td>
                    <td style={{ border: CELL_BORDER }} />
                    <td style={{ border: CELL_BORDER }} />
                    <td style={{ padding: "0 6px", textAlign: "right", fontWeight: 600, color: "#dc2626", whiteSpace: "nowrap", border: CELL_BORDER }}>
                      -{yen(row.amount)}
                    </td>
                  </tr>
                );
              }
              if (row.kind === "note") {
                return (
                  <tr key={i} data-print-section style={style}>
                    <td style={{ padding: "0 6px", fontSize: 9.5, color: "#dc2626", border: CELL_BORDER }}>
                      {row.text ? `※${row.text}` : " "}
                    </td>
                    <td style={{ border: CELL_BORDER }} />
                    <td style={{ border: CELL_BORDER }} />
                    <td style={{ border: CELL_BORDER }} />
                  </tr>
                );
              }
              return (
                <tr key={i} style={style}>
                  <td style={{ border: CELL_BORDER }} />
                  <td style={{ border: CELL_BORDER }} />
                  <td style={{ border: CELL_BORDER }} />
                  <td style={{ border: CELL_BORDER }} />
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 小計・消費税・合計。摘要欄は罫線なしの空白、ラベルは数量列の下付近に
            枠なしで配置し、数字は単価+金額列を合わせた幅の枠内で右寄せにする。
            背景は白のまま、合計だけ太字にする。 */}
        <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse", fontSize: 11 }} data-print-section>
          <colgroup>
            <col />
            <col style={{ width: QTY_COL }} />
            <col style={{ width: UNIT_PRICE_COL + AMOUNT_COL }} />
          </colgroup>
          <tbody>
            <tr style={{ height: DETAIL_ROW_HEIGHT }}>
              <td />
              <td style={{ padding: "0 4px", textAlign: "right", whiteSpace: "nowrap" }}>小計</td>
              <td style={{ padding: "0 6px", textAlign: "right", border: CELL_BORDER, whiteSpace: "nowrap" }}>{yen(estimate.subtotal)}</td>
            </tr>
            <tr style={{ height: DETAIL_ROW_HEIGHT }}>
              <td />
              <td style={{ padding: "0 4px", textAlign: "right", whiteSpace: "nowrap" }}>消費税</td>
              <td style={{ padding: "0 6px", textAlign: "right", border: CELL_BORDER, whiteSpace: "nowrap" }}>{yen(estimate.taxAmount)}</td>
            </tr>
            <tr style={{ height: DETAIL_ROW_HEIGHT }}>
              <td />
              <td style={{ padding: "0 4px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>合計</td>
              <td style={{ padding: "0 6px", textAlign: "right", border: CELL_BORDER, fontWeight: 700, whiteSpace: "nowrap" }}>
                {yen(estimate.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
