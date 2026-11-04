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

// PDF保存専用の静止レイアウト。/result のDiagnosisPrintDocumentと同じ方式
// （lib/pdf.tsのexportResultToPDF、html-to-image+jsPDFでdata-print-section単位に
// 高さを切り分ける）を踏襲する。成長DB（デスクトップ幅の管理画面）配下の機能のため、
// 480px固定だった公開ページ側と違い、明細テーブルが読みやすいよう600px幅にしている。
export default function EstimatePrintDocument({ estimate, clientLabel, lineItems }: EstimatePrintDocumentProps) {
  const groups = groupByCategory(lineItems);
  const issuedDateLabel = new Date(estimate.createdAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const validUntilLabel = estimate.validUntil
    ? new Date(estimate.validUntil).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div style={{ width: 600, backgroundColor: "#FAF8F3", fontFamily: "'Noto Sans JP', sans-serif" }}>
      {/* ヘッダー */}
      <div data-print-section style={{ padding: "32px 36px 20px" }}>
        <p style={{ color: "#C4788A", fontSize: 11, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 6 }}>
          KOKO DESIGN
        </p>
        <h1 style={{ color: "#1a1a1a", fontSize: 24, fontWeight: 800, marginBottom: 20 }}>御見積書</h1>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>{clientLabel} 御中</p>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "#6b7280" }}>発行日: {issuedDateLabel}</p>
            {validUntilLabel && <p style={{ fontSize: 11, color: "#6b7280" }}>有効期限: {validUntilLabel}</p>}
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#4b5563", marginTop: 12 }}>件名: {estimate.title}</p>
      </div>

      {/* 明細（カテゴリ毎に分割し、ページの途中でカテゴリが割れないようにする） */}
      {groups.map((group) => (
        <div key={group.category} data-print-section style={{ padding: "0 36px 16px" }}>
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #f3f4f6", overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", background: "#F5F0EA" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{group.category}</p>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <th style={{ textAlign: "left", padding: "8px 18px", fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>項目</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>数量</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>単価</th>
                  <th style={{ textAlign: "right", padding: "8px 18px", fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>金額</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item, i) => {
                  const undiscountedUnitPrice = item.unitPrice + item.discountAmount;
                  const isLast = i === group.items.length - 1 && item.discountAmount <= 0;
                  return (
                    <Fragment key={i}>
                      <tr style={{ borderBottom: isLast ? "none" : "1px solid #f9fafb" }}>
                        <td style={{ padding: "10px 18px", fontSize: 12, color: "#1a1a1a" }}>
                          {item.name}
                          {item.description && <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{item.description}</div>}
                          {item.procurementCost > 0 && (
                            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>仕入れ料金 {yen(item.procurementCost)}</div>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#4b5563", textAlign: "right", whiteSpace: "nowrap" }}>
                          {item.quantity} {item.unit}
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: 12, color: "#4b5563", textAlign: "right", whiteSpace: "nowrap" }}>
                          {yen(undiscountedUnitPrice)}
                        </td>
                        <td style={{ padding: "10px 18px", fontSize: 12, fontWeight: 600, color: "#1a1a1a", textAlign: "right", whiteSpace: "nowrap" }}>
                          {yen(undiscountedUnitPrice * item.quantity)}
                        </td>
                      </tr>
                      {item.discountAmount > 0 && (
                        <tr style={{ borderBottom: i < group.items.length - 1 ? "1px solid #f9fafb" : "none" }}>
                          <td colSpan={3} style={{ padding: "6px 18px", fontSize: 12, color: "#dc2626" }}>
                            {item.discountLabel}
                          </td>
                          <td style={{ padding: "6px 18px", fontSize: 12, fontWeight: 600, color: "#dc2626", textAlign: "right", whiteSpace: "nowrap" }}>
                            -{yen(item.discountAmount * item.quantity)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* 合計サマリー */}
      <div data-print-section style={{ padding: "0 36px 16px" }}>
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #f3f4f6", padding: "16px 22px", marginLeft: "auto", width: 260 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>小計</span>
            <span style={{ fontSize: 12, color: "#1a1a1a" }}>{yen(estimate.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>消費税（{Math.round(estimate.taxRate * 100)}%）</span>
            <span style={{ fontSize: 12, color: "#1a1a1a" }}>{yen(estimate.taxAmount)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 10,
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>合計</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#C4788A" }}>{yen(estimate.total)}</span>
          </div>
        </div>
      </div>

      {/* 備考 */}
      {estimate.notes && (
        <div data-print-section style={{ padding: "0 36px 16px" }}>
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #f3f4f6", padding: "14px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>備考</p>
            <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{estimate.notes}</p>
          </div>
        </div>
      )}

      {/* フッター（会社情報） */}
      <div data-print-section style={{ padding: "8px 36px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>株式会社ココデザイン</p>
        <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>〒460-0012 愛知県名古屋市中区千代田3丁目11-32 5F</p>
        <p style={{ fontSize: 10, color: "#9ca3af" }}>TEL. 090-1287-7557 ／ koko-design.com</p>
      </div>
    </div>
  );
}
