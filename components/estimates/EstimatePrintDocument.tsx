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
// 値引きは摘要側に赤字で別行表示・単価/数量/金額の4列表）の見た目にできるだけ合わせている。
// 数量は金額計算には使わない表記情報のため、単価欄は参考として列だけ残し、値は入れない。
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

  return (
    <div style={{ width: 640, backgroundColor: "white", fontFamily: "'Noto Sans JP', sans-serif", color: INK }}>
      {/* タイトルバー */}
      <div data-print-section style={{ padding: "28px 40px 0" }}>
        <div style={{ background: "#e5e5e5", padding: "14px 0", textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.5em", margin: 0 }}>御見積書</h1>
        </div>

        {/* 宛先・見積番号・見積日 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20 }}>
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

        {/* 件名等（左）・自社情報（右）。件名が長い場合でも右側の会社情報が画面外に
            はみ出さないよう、両側ともwhiteSpace:nowrapにせず折り返し可能にし、
            minWidth:0でflexアイテムが縮められるようにしている。 */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 24 }}>
          <div style={{ fontSize: 12.5, lineHeight: 2, minWidth: 0, flex: "1 1 auto" }}>
            <p>下記のとおり、御見積り申し上げます。</p>
            <p>件名：{estimate.title}</p>
            <p>納期：{productionDateLabel ?? ""}</p>
            <p>支払条件：</p>
            <p>有効期限：御見積後４週間</p>
          </div>
          <div style={{ fontSize: 11.5, color: "#4b5563", lineHeight: 1.8, textAlign: "right", minWidth: 0, flexShrink: 0 }}>
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
              <th style={{ textAlign: "center", padding: "8px 6px", fontWeight: 700, width: 80 }}>数量</th>
              <th style={{ textAlign: "right", padding: "8px 6px", fontWeight: 700, width: 90 }}>単価</th>
              <th style={{ textAlign: "right", padding: "8px 6px", fontWeight: 700, width: 100 }}>金額</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.category}>
                <tr data-print-section>
                  <td colSpan={4} style={{ padding: "10px 6px 4px", fontWeight: 700 }}>
                    ●{group.category}
                  </td>
                </tr>
                {group.items.map((item, i) => {
                  const descLines = item.description ? item.description.split("\n") : [];
                  // 項目のまとまりの最後の行にだけ罫線を引く（完成系の見積書と同様、
                  // 名称行と補足説明の間は罫線無しでひと塊に見せる）。
                  const hasTrailingRows = descLines.length > 0 || item.procurementCost > 0 || item.discountAmount > 0;
                  return (
                    <Fragment key={i}>
                      <tr data-print-section style={hasTrailingRows ? undefined : { borderBottom: `1px solid ${LINE}` }}>
                        <td style={{ padding: "8px 6px" }}>・{item.name}</td>
                        <td style={{ padding: "8px 6px", textAlign: "center", whiteSpace: "nowrap" }}>
                          {item.quantity}　{item.unit}
                        </td>
                        <td style={{ padding: "8px 6px" }} />
                        <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {yen(item.unitPrice)}
                        </td>
                      </tr>
                      {/* サイズ・用紙・カラー等の補足説明は、完成系の見積書と同様に
                          1行ずつ独立した行として表示する（改行区切りで複数行入れられる）。 */}
                      {descLines.map((line, li) => {
                        const isLast = li === descLines.length - 1 && item.procurementCost === 0 && item.discountAmount === 0;
                        return (
                          <tr key={`desc-${li}`} style={isLast ? { borderBottom: `1px solid ${LINE}` } : undefined}>
                            <td colSpan={4} style={{ padding: "4px 6px", fontSize: 11, color: "#6b7280" }}>
                              　{line}
                            </td>
                          </tr>
                        );
                      })}
                      {item.procurementCost > 0 && (
                        <tr style={item.discountAmount === 0 ? { borderBottom: `1px solid ${LINE}` } : undefined}>
                          <td colSpan={4} style={{ padding: "4px 6px", fontSize: 11, color: "#6b7280" }}>
                            　仕入れ料金 {yen(item.procurementCost)}
                          </td>
                        </tr>
                      )}
                      {item.discountAmount > 0 && (
                        <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                          <td colSpan={3} style={{ padding: "6px 6px", color: "#dc2626" }}>
                            　{item.discountLabel}
                          </td>
                          <td style={{ padding: "6px 6px", textAlign: "right", fontWeight: 600, color: "#dc2626", whiteSpace: "nowrap" }}>
                            -{yen(item.discountAmount)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
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
