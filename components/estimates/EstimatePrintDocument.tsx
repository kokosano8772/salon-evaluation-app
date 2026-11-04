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
const LINE = "#d4d4d4";

// PDF保存専用の静止レイアウト。/result のDiagnosisPrintDocumentと同じ方式
// （lib/pdf.tsのexportResultToPDF、html-to-image+jsPDFでdata-print-section単位に
// 高さを切り分ける）を踏襲する。デザインは実際にユーザーが使っている紙の見積書
// （御見積書・白地に罫線・合計金額の強調ボックス・摘要＝カテゴリを●見出しでまとめる・
// 値引きは摘要側に赤字で別行表示）の見た目にできるだけ合わせている。数量は金額計算には
// 使わない表記情報のため、単価列は設けず「摘要／数量／金額」の3列構成にしている。
export default function EstimatePrintDocument({ estimate, clientLabel, lineItems }: EstimatePrintDocumentProps) {
  const groups = groupByCategory(lineItems);
  const issuedDateLabel = new Date(estimate.createdAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const productionDateLabel = estimate.productionDate
    ? new Date(estimate.productionDate).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div style={{ width: 640, backgroundColor: "white", fontFamily: "'Noto Sans JP', sans-serif", color: INK }}>
      {/* タイトルバー */}
      <div data-print-section style={{ padding: "28px 40px 0" }}>
        <div style={{ background: "#e5e5e5", padding: "14px 0", textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.5em", margin: 0 }}>御見積書</h1>
        </div>

        {/* 宛先・見積日 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20 }}>
          <p style={{ fontSize: 17, fontWeight: 700, borderBottom: `2px solid ${INK}`, paddingBottom: 4, minWidth: 220 }}>
            {clientLabel} 御中
          </p>
          <p style={{ fontSize: 12, color: "#4b5563" }}>見積日：{issuedDateLabel}</p>
        </div>

        {/* 件名等（左）・自社情報（右） */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 24 }}>
          <div style={{ fontSize: 12.5, lineHeight: 2 }}>
            <p>下記のとおり、御見積り申し上げます。</p>
            <p>件名：{estimate.title}</p>
            {productionDateLabel && <p>制作日：{productionDateLabel}</p>}
          </div>
          <div style={{ fontSize: 11.5, color: "#4b5563", lineHeight: 1.8, textAlign: "right", whiteSpace: "nowrap" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: INK }}>株式会社　ココデザイン</p>
            <p>〒460-0012</p>
            <p>愛知県名古屋市中区千代田3丁目11-32 5F</p>
            <p>TEL：090-1287-7557</p>
          </div>
        </div>
      </div>

      {/* 合計金額（強調） */}
      <div data-print-section style={{ padding: "20px 40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", border: `1px solid ${INK}` }}>
          <div style={{ background: "#e5e5e5", padding: "12px 24px", fontSize: 14, fontWeight: 700 }}>合計金額</div>
          <div style={{ padding: "12px 24px", fontSize: 22, fontWeight: 700 }}>
            {yen(estimate.total)}
            <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 8 }}>（税込）</span>
          </div>
        </div>
      </div>

      {/* 明細 */}
      <div style={{ padding: "16px 40px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
          <thead>
            <tr style={{ borderTop: `2px solid ${INK}`, borderBottom: `2px solid ${INK}` }}>
              <th style={{ textAlign: "left", padding: "8px 6px", fontWeight: 700 }}>摘要</th>
              <th style={{ textAlign: "center", padding: "8px 6px", fontWeight: 700, width: 90 }}>数量</th>
              <th style={{ textAlign: "right", padding: "8px 6px", fontWeight: 700, width: 110 }}>金額</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.category}>
                <tr data-print-section>
                  <td colSpan={3} style={{ padding: "10px 6px 4px", fontWeight: 700 }}>
                    ●{group.category}
                  </td>
                </tr>
                {group.items.map((item, i) => (
                  <Fragment key={i}>
                    <tr data-print-section style={{ borderBottom: `1px solid ${LINE}` }}>
                      <td style={{ padding: "8px 6px" }}>
                        ・{item.name}
                        {item.description && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>　{item.description}</div>}
                        {item.procurementCost > 0 && (
                          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>　仕入れ料金 {yen(item.procurementCost)}</div>
                        )}
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "center", whiteSpace: "nowrap" }}>
                        {item.quantity}　{item.unit}
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {yen(item.unitPrice)}
                      </td>
                    </tr>
                    {item.discountAmount > 0 && (
                      <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                        <td colSpan={2} style={{ padding: "6px 6px", color: "#dc2626" }}>
                          　{item.discountLabel}
                        </td>
                        <td style={{ padding: "6px 6px", textAlign: "right", fontWeight: 600, color: "#dc2626", whiteSpace: "nowrap" }}>
                          -{yen(item.discountAmount)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 備考・注意事項（赤字） */}
      {estimate.notes && (
        <div data-print-section style={{ padding: "10px 40px 0" }}>
          {estimate.notes.split("\n").map((line, i) => (
            <p key={i} style={{ fontSize: 11, color: "#dc2626", lineHeight: 1.8, margin: 0 }}>
              {line ? `※${line}` : " "}
            </p>
          ))}
        </div>
      )}

      {/* 小計・消費税・合計 */}
      <div data-print-section style={{ padding: "16px 40px 36px" }}>
        <table style={{ marginLeft: "auto", width: 260, fontSize: 13, borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "6px 10px", fontWeight: 700, background: "#f5f5f5", border: `1px solid ${LINE}` }}>小計</td>
              <td style={{ padding: "6px 10px", textAlign: "right", border: `1px solid ${LINE}` }}>{yen(estimate.subtotal)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 10px", fontWeight: 700, background: "#f5f5f5", border: `1px solid ${LINE}` }}>
                消費税（{Math.round(estimate.taxRate * 100)}%）
              </td>
              <td style={{ padding: "6px 10px", textAlign: "right", border: `1px solid ${LINE}` }}>{yen(estimate.taxAmount)}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 10px", fontWeight: 700, background: "#e5e5e5", border: `1px solid ${INK}`, fontSize: 14 }}>
                合計
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  textAlign: "right",
                  border: `1px solid ${INK}`,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {yen(estimate.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
