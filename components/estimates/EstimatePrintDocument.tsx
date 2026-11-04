import { Fragment } from "react";
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
const LINE = "#9ca3af";

// 明細表は外枠・縦線・横線のある格子状の表にする（摘要/数量/単価/金額の4列を
// セルの罫線で明確に区切る。colSpanでまたぐ行も含め、どの<td>にも同じborderを
// 付けてグリッドを崩さないようにする）。
const CELL_BORDER = `1px solid ${LINE}`;

// PDF保存専用の静止レイアウト。/result のDiagnosisPrintDocumentと同じ方式
// （lib/pdf.tsのexportResultToPDF、html-to-image+jsPDFでdata-print-section単位に
// 高さを切り分ける）を踏襲する。デザインは実際にユーザーが使っている紙の見積書
// （御見積書・白地に格子状の罫線のある表・合計金額の強調ボックス・摘要＝カテゴリを
// ●見出しでまとめる・値引きは赤字で表示・単価/数量/金額の4列表）の見た目に
// できるだけ合わせている。数量は金額計算には使わない表記情報のため、単価欄は
// 参考として列だけ残し、値は入れない。
export default function EstimatePrintDocument({ estimate, clientLabel, lineItems }: EstimatePrintDocumentProps) {
  const groups = groupByCategory(lineItems);
  // 完成系の参考画像は「2026/08/27」のスラッシュ区切り表記のため、それに合わせる
  // （toLocaleDateStringのlong表記だと「2026年8月27日」になってしまい見た目が違う）。
  const formatSlashDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };
  const issuedDateLabel = formatSlashDate(estimate.createdAt);
  // 参考画像に「制作日」の行は無く、「納期」の行に日付が入る形なので、
  // ビルダー側で入力する制作日（productionDate）をここでは「納期」として表示する。
  const productionDateLabel = estimate.productionDate ? formatSlashDate(estimate.productionDate) : null;
  const notesLines = estimate.notes ? estimate.notes.split("\n") : [];

  return (
    <div
      style={{
        width: 640,
        backgroundColor: "white",
        fontFamily: "'Noto Sans JP', sans-serif",
        color: INK,
        border: `1px solid ${LINE}`,
      }}
    >
      {/* タイトルバー */}
      <div data-print-section style={{ padding: "22px 40px 0" }}>
        <div style={{ background: "#e5e5e5", padding: "8px 0", textAlign: "center" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.5em", margin: 0 }}>御見積書</h1>
        </div>

        {/* 宛先・見積番号・見積日 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16 }}>
          <div style={{ minWidth: 220 }}>
            <p style={{ fontSize: 17, fontWeight: 700, borderBottom: `2px solid ${INK}`, paddingBottom: 4 }}>
              {clientLabel} 御中
            </p>
            {estimate.clientContact && (
              <p style={{ fontSize: 12.5, marginTop: 6 }}>ご担当　{estimate.clientContact}　様</p>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#4b5563", textAlign: "right", lineHeight: 1.9 }}>
            <p>見積番号：</p>
            <p>見積日：{issuedDateLabel}</p>
          </div>
        </div>

        {/* 件名等（左）・自社情報＋社印（右）。件名が長い場合でも右側の会社情報が
            画面外にはみ出さないよう、両側ともwhiteSpace:nowrapにせず折り返し可能にし、
            minWidth:0でflexアイテムが縮められるようにしている。 */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 24 }}>
          <div style={{ fontSize: 12.5, lineHeight: 2, minWidth: 0, flex: "1 1 auto" }}>
            <p>下記のとおり、御見積り申し上げます。</p>
            <p>件名：{estimate.title}</p>
            <p>納期：{productionDateLabel ?? ""}</p>
            <p>支払条件：</p>
            <p>有効期限：御見積後４週間</p>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
            <div style={{ fontSize: 11.5, color: "#4b5563", lineHeight: 1.8, textAlign: "right", minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: INK }}>株式会社　ココデザイン</p>
              <p>〒460-0012</p>
              <p>愛知県名古屋市中区千代田3丁目11-32 5F</p>
              <p>TEL：090-1287-7557</p>
              {/* created_byはログイン時のメールアドレスのため、クライアント向けの
                  表記としては@より前の部分だけを担当者名として表示する。 */}
              {estimate.createdBy && <p>担当：{estimate.createdBy.split("@")[0]}</p>}
            </div>
            {/* 社印画像を貼る位置のスペース（実画像は未導入。枠だけ確保） */}
            <div
              style={{
                width: 56,
                height: 56,
                border: `1px solid ${LINE}`,
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      </div>

      {/* 合計金額（強調）。表の全幅には伸ばさず内容に合わせた幅にし
          （display:inline-flexでコンテンツ幅にフィット）、ラベルと金額の間は
          縦線で区切る。 */}
      <div data-print-section style={{ padding: "16px 40px 0" }}>
        <div style={{ display: "inline-flex", alignItems: "stretch", border: `1px solid ${INK}` }}>
          <div
            style={{
              background: "#e5e5e5",
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              borderRight: `1px solid ${INK}`,
            }}
          >
            合計金額
          </div>
          <div style={{ padding: "8px 20px", fontSize: 20, fontWeight: 700, whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
            {yen(estimate.total)}
            <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 8 }}>（税込）</span>
          </div>
        </div>
      </div>

      {/* 明細。外枠・縦線・横線のある格子状の表にする。注意事項・小計/消費税/合計も
          同じ表の続きとして配置し、表と summary の間に隙間を作らない。 */}
      <div style={{ padding: "12px 40px 0" }}>
        <table
          style={{
            width: "100%",
            tableLayout: "fixed",
            borderCollapse: "collapse",
            fontSize: 12,
            border: `1px solid ${INK}`,
          }}
        >
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 700, border: CELL_BORDER }}>摘要</th>
              <th style={{ textAlign: "center", padding: "6px 8px", fontWeight: 700, width: 60, border: CELL_BORDER }}>数量</th>
              <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 700, width: 110, border: CELL_BORDER }}>単価</th>
              <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 700, width: 100, border: CELL_BORDER }}>金額</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.category}>
                <tr data-print-section>
                  <td colSpan={4} style={{ padding: "5px 8px 2px", fontWeight: 700, border: CELL_BORDER }}>
                    ●{group.category}
                  </td>
                </tr>
                {group.items.map((item, i) => {
                  const descLines = item.description ? item.description.split("\n") : [];
                  return (
                    <Fragment key={i}>
                      <tr data-print-section>
                        <td style={{ padding: "4px 8px", border: CELL_BORDER }}>・{item.name}</td>
                        <td style={{ padding: "4px 8px", textAlign: "center", whiteSpace: "nowrap", border: CELL_BORDER }}>
                          {item.quantity}　{item.unit}
                        </td>
                        <td style={{ padding: "4px 8px", border: CELL_BORDER }} />
                        <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 600, whiteSpace: "nowrap", border: CELL_BORDER }}>
                          {yen(item.unitPrice)}
                        </td>
                      </tr>
                      {/* サイズ・用紙・カラー等の補足説明は、摘要欄の中に複数行で
                          表示する（改行区切りで複数行入れられる）。 */}
                      {descLines.map((line, li) => (
                        <tr key={`desc-${li}`} data-print-section>
                          <td colSpan={4} style={{ padding: "2px 8px", fontSize: 10.5, color: "#6b7280", border: CELL_BORDER }}>
                            　{line}
                          </td>
                        </tr>
                      ))}
                      {item.procurementCost > 0 && (
                        <tr data-print-section>
                          <td colSpan={4} style={{ padding: "2px 8px", fontSize: 10.5, color: "#6b7280", border: CELL_BORDER }}>
                            　仕入れ料金 {yen(item.procurementCost)}
                          </td>
                        </tr>
                      )}
                      {item.discountAmount > 0 && (
                        <tr data-print-section>
                          <td colSpan={3} style={{ padding: "4px 8px", color: "#dc2626", textAlign: "right", border: CELL_BORDER }}>
                            {item.discountLabel}
                          </td>
                          <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 600, color: "#dc2626", whiteSpace: "nowrap", border: CELL_BORDER }}>
                            -{yen(item.discountAmount)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}

            {/* 注意事項（赤字）も表の続きの行として表示する */}
            {notesLines.map((line, i) => (
              <tr key={`note-${i}`} data-print-section>
                <td colSpan={4} style={{ padding: "2px 8px", fontSize: 10.5, color: "#dc2626", border: CELL_BORDER }}>
                  {line ? `※${line}` : " "}
                </td>
              </tr>
            ))}

            {/* 小計・消費税・合計。摘要/数量列は空白のまま、単価+金額列をまたいで
                ラベルと金額を表示する（列幅のズレを避けるため単価/金額はcolSpanで
                まとめ、ラベル側は右寄せにして金額との間に余白を作る）。 */}
            <tr data-print-section>
              <td colSpan={2} style={{ border: CELL_BORDER }} />
              <td style={{ padding: "5px 8px", fontWeight: 700, textAlign: "right", border: CELL_BORDER, whiteSpace: "nowrap" }}>
                小計
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", border: CELL_BORDER, whiteSpace: "nowrap" }}>
                {yen(estimate.subtotal)}
              </td>
            </tr>
            <tr data-print-section>
              <td colSpan={2} style={{ border: CELL_BORDER }} />
              <td style={{ padding: "5px 8px", fontWeight: 700, textAlign: "right", border: CELL_BORDER, whiteSpace: "nowrap" }}>
                消費税（{Math.round(estimate.taxRate * 100)}%）
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", border: CELL_BORDER, whiteSpace: "nowrap" }}>
                {yen(estimate.taxAmount)}
              </td>
            </tr>
            <tr data-print-section>
              <td colSpan={2} style={{ border: CELL_BORDER }} />
              <td style={{ padding: "6px 8px", fontWeight: 700, textAlign: "right", background: "#e5e5e5", border: CELL_BORDER, fontSize: 13, whiteSpace: "nowrap" }}>
                合計
              </td>
              <td style={{ padding: "6px 8px", textAlign: "right", background: "#e5e5e5", border: CELL_BORDER, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
                {yen(estimate.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ height: 32 }} />
    </div>
  );
}
