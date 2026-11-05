import { EstimateHeader, LineItem } from "./types";

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
const CONTENT_WIDTH = mm(167);
const TABLE_TOP = mm(112); // 明細表の左上：用紙上端から112mm
const DETAIL_ROWS = 24; // 見出し行を除く明細表の行数（見本に合わせた固定数）
const HEADER_ROW_HEIGHT = mm(7.5);
const DETAIL_ROW_HEIGHT = mm(5.9);
// 0.8pxだとキャプチャ時の端数丸めで罫線が消えることがあったため1pxにする
// （太さの見た目はほぼ変わらない）。
const CELL_BORDER = `1px solid ${LINE}`;
const GRAY = "#D8D8D8";

// 摘要/数量/単価/金額の4列幅（内容幅167mmの中で、摘要が残り全部を取る。
// 比率は摘要52.4%・数量12.6%・単価17.5%・金額17.5%）
const QTY_COL = mm(21);
const UNIT_PRICE_COL = mm(29.2);
const AMOUNT_COL = mm(29.2);

type Row =
  | { kind: "item"; name: string; quantity: number; unit: string; unitPrice: number }
  | { kind: "desc"; text: string }
  | { kind: "discount"; label: string; amount: number }
  | { kind: "note"; text: string }
  | { kind: "blank" };

// 「8割以上修正」のような社内の料金区分（割合）は、価格表で項目を選び分けるための
// 内部的な情報であり、クライアント向けの見積書にそのまま出すものではないため、
// 印刷時だけ名前から取り除く（価格表・見積もり編集画面では区分が見えたままでよい
// ので、データ自体は書き換えずここで表示用に加工するだけ）。
function stripInternalTierLabel(name: string): string {
  return name.replace(/[（(][^（）()]*割[^（）()]*[）)]/g, "").trim();
}

// 追加時に入力した「商品名：〇〇」の行があれば、それを摘要の主表記として使い
// （価格表側の内部的な項目名の代わりに）、補足説明からはその行を除く。
// 無ければ従来通り価格表の項目名を使う。
function splitDescription(item: LineItem): { displayName: string; descLines: string[] } {
  const lines = item.description ? item.description.split("\n") : [];
  const productLine = lines.find((l) => l.startsWith("商品名："));
  const descLines = lines.filter((l) => l !== productLine);
  const displayName = productLine ? productLine.replace("商品名：", "").trim() : stripInternalTierLabel(item.name);
  return { displayName, descLines };
}

// 明細・補足・値引き・注意事項を24行固定のフラットな行リストに変換する。
// 足りない分は空行で埋め、見本と同じく最後まで罫線が途切れないようにする。
// カテゴリ見出しの行は出さない（印刷物制作のような大まかな区分や、見出しとして
// 出していたsubcategoryは、見積もり全体の件名の方で表現する運用にしたため）。
function buildRows(lineItems: LineItem[], notes: string): Row[] {
  const rows: Row[] = [];
  for (const item of lineItems) {
    const { displayName, descLines } = splitDescription(item);
    rows.push({ kind: "item", name: displayName, quantity: item.quantity, unit: item.unit, unitPrice: item.unitPrice });
    for (const line of descLines) {
      rows.push({ kind: "desc", text: line });
    }
    // 仕入れ料金は金額には含めるが（amountの計算は変更無し）、クライアント向けの
    // 印刷物には内訳として出さない（社内の仕入れ原価を見せないため）。
    if (item.discountAmount > 0) {
      rows.push({ kind: "discount", label: item.discountLabel, amount: item.discountAmount });
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
// 上部の各ブロック（宛先・ご担当・案内文・自社情報・見積番号/見積日・社印・合計金額枠）
// は、見本を実測した「用紙左上からの位置」でposition:absolute配置し、通常の
// flexレイアウトの積み重ねでは再現しづらいmm単位の精度を出している。
// 数量は金額計算には使わない表記情報のため、単価欄は参考として列だけ残し、値は入れない。
export default function EstimatePrintDocument({ estimate, clientLabel, lineItems }: EstimatePrintDocumentProps) {
  const rows = buildRows(lineItems, estimate.notes);

  const formatSlashDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };
  const issuedDateLabel = formatSlashDate(estimate.createdAt);
  const productionDateLabel = estimate.productionDate ? formatSlashDate(estimate.productionDate) : null;

  return (
    <div style={{ width: 640, backgroundColor: "white", fontFamily: "'Noto Sans JP', sans-serif", color: INK }}>
      {/* 上部ヘッダー一式。高さをTABLE_TOPぴったりに固定し、中の各要素は
          実測した絶対座標（用紙左上基準）で配置する。 */}
      <div data-print-section style={{ position: "relative", height: TABLE_TOP }}>
        {/* タイトルバー：用紙上端から19mm、高さ9mm */}
        <div
          style={{
            position: "absolute",
            left: SIDE_MARGIN,
            top: mm(19),
            width: CONTENT_WIDTH,
            height: mm(9),
            background: GRAY,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h1 style={{ fontSize: 17, fontWeight: 500, letterSpacing: 0, margin: 0 }}>御　見　積　書</h1>
        </div>

        {/* 宛先の会社名：左22mm・上41mm */}
        <p style={{ position: "absolute", left: mm(22), top: mm(41), fontSize: 14, fontWeight: 400, margin: 0 }}>
          {clientLabel} 御中
        </p>
        {/* 「ご担当」の行：左27mm・上48mm */}
        <p style={{ position: "absolute", left: mm(27), top: mm(48), fontSize: 11, margin: 0 }}>
          ご担当　{estimate.clientContact || "　　　　"}　様
        </p>

        {/* 「下記のとおり〜」案内文ブロック：左22mm・上60mm。自社情報(左110mm)と
            重ならないよう幅は88mm（110-22）までに収める。 */}
        <div style={{ position: "absolute", left: mm(22), top: mm(60), width: mm(88), fontSize: 11, lineHeight: 1.75 }}>
          <p style={{ margin: 0 }}>下記のとおり、御見積り申し上げます。</p>
          <p style={{ margin: 0 }}>件名：{estimate.title}</p>
          <p style={{ margin: 0 }}>納期：{productionDateLabel ?? ""}</p>
          <p style={{ margin: 0 }}>支払条件：</p>
          <p style={{ margin: 0 }}>有効期限：御見積後４週間</p>
        </div>

        {/* 自社情報ブロック：左110mm・上60mm。見積番号/見積日（左131mm）とは
            別の開始位置。TEL・担当者名は会社名より少し字下げする。 */}
        <div style={{ position: "absolute", left: mm(110), top: mm(60), width: mm(78.5), fontSize: 11, lineHeight: 1.6 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 400 }}>株式会社　ココデザイン</p>
          <p style={{ margin: 0 }}>〒460-0012</p>
          <p style={{ margin: 0, whiteSpace: "nowrap" }}>愛知県名古屋市中区千代田3丁目11-32 5F</p>
          <p style={{ margin: "6px 0 0 8px" }}>TEL：090-1287-7557</p>
          {/* created_byはログイン時のメールアドレスのため、クライアント向けの
              表記としては@より前の部分だけを担当者名として表示する。 */}
          <p style={{ margin: "0 0 0 8px" }}>担当：{estimate.createdBy ? estimate.createdBy.split("@")[0] : ""}</p>
        </div>

        {/* 見積番号・見積日ブロック：左131mm・上35mm。ラベル幅を揃えて、
            値の開始位置も揃う2カラムにする（見積番号が空でもラベルが右へ寄らない）。 */}
        <div style={{ position: "absolute", left: mm(131), top: mm(35), fontSize: 11, lineHeight: 1.6 }}>
          <div style={{ display: "flex" }}>
            <span style={{ width: mm(19) }}>見積番号：</span>
            <span></span>
          </div>
          <div style={{ display: "flex" }}>
            <span style={{ width: mm(19) }}>見積日：</span>
            <span>{issuedDateLabel}</span>
          </div>
        </div>

        {/* 社印画像を貼る位置のスペース（実画像は未導入。枠だけ確保）。
            目安は左162mm・上76mmだが、実測で住所の最終行が76mm付近まで
            伸びて枠に触れるため、上端は79mmに調整して住所と重ならないようにする
            （TEL行の開始位置とほぼ揃う）。 */}
        <div
          style={{
            position: "absolute",
            left: mm(162),
            top: mm(79),
            width: mm(20),
            height: mm(20),
            border: `1px solid ${LINE}`,
          }}
        />

        {/* 合計金額（強調）：左21.5mm・上100mm、幅88mm（ラベル29mm＋金額59mm）、高さ9mm。
            ラベルセル・金額セルそれぞれに個別の罫線を持たせ、罫線の欠けを無くす。 */}
        <div style={{ position: "absolute", left: SIDE_MARGIN, top: mm(100), display: "flex", width: mm(88), height: mm(9) }}>
          <div
            style={{
              width: mm(29),
              background: GRAY,
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px solid ${INK}`,
              borderRight: "none",
              boxSizing: "border-box",
            }}
          >
            合計金額
          </div>
          <div
            style={{
              width: mm(59),
              padding: "0 10px",
              fontSize: 16,
              fontWeight: 700,
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              border: `1px solid ${INK}`,
              boxSizing: "border-box",
            }}
          >
            <span />
            {yen(estimate.total)}
            <span style={{ fontSize: 10, fontWeight: 500 }}>（税込）</span>
          </div>
        </div>
      </div>

      {/* 明細（24行固定の格子状の表）。見出し背景は白、4列は中央揃え。
          小計・消費税・合計も同じ表の続きの行として配置し、摘要・数量列の下は
          罫線の無い空白のままにする（単価+金額列のみ枠を付ける）。 */}
      <div style={{ paddingLeft: SIDE_MARGIN, paddingRight: SIDE_MARGIN }}>
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
              if (row.kind === "item") {
                return (
                  <tr key={i} data-print-section style={style}>
                    <td style={{ padding: "0 6px", border: CELL_BORDER }}>・{row.name}</td>
                    <td style={{ padding: "0 4px", textAlign: "center", whiteSpace: "nowrap", border: CELL_BORDER }}>
                      {row.quantity}　{row.unit}
                    </td>
                    <td style={{ border: CELL_BORDER }} />
                    <td style={{ padding: "0 6px", textAlign: "right", verticalAlign: "middle", fontSize: 11.5, fontWeight: 400, whiteSpace: "nowrap", border: CELL_BORDER }}>
                      {yen(row.unitPrice)}
                    </td>
                  </tr>
                );
              }
              if (row.kind === "desc") {
                return (
                  <tr key={i} data-print-section style={style}>
                    <td style={{ padding: "0 6px", fontSize: 10.5, color: INK, border: CELL_BORDER }}>　{row.text}</td>
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
                    <td style={{ padding: "0 6px", textAlign: "right", verticalAlign: "middle", fontSize: 11.5, fontWeight: 400, color: "#dc2626", whiteSpace: "nowrap", border: CELL_BORDER }}>
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

            {/* 小計・消費税・合計。項目名は金額枠の外（数量列の下、罫線なし）に
                中央揃えで配置し、単価+金額列を合わせた枠の中には数字だけを
                右寄せで入れる。同じ<table>内の行にすることで、別テーブルに
                分けた場合に起きる罫線の二重描画（太く見える問題）も避けられる。 */}
            <tr data-print-section style={{ height: DETAIL_ROW_HEIGHT }}>
              <td />
              <td style={{ textAlign: "center", verticalAlign: "middle", fontWeight: 700 }}>小計</td>
              <td colSpan={2} style={{ padding: "0 6px", textAlign: "right", verticalAlign: "middle", fontSize: 12.5, fontWeight: 400, border: CELL_BORDER }}>
                {yen(estimate.subtotal)}
              </td>
            </tr>
            <tr data-print-section style={{ height: DETAIL_ROW_HEIGHT }}>
              <td />
              <td style={{ textAlign: "center", verticalAlign: "middle", fontWeight: 700 }}>消費税</td>
              <td colSpan={2} style={{ padding: "0 6px", textAlign: "right", verticalAlign: "middle", fontSize: 12.5, fontWeight: 400, border: CELL_BORDER }}>
                {yen(estimate.taxAmount)}
              </td>
            </tr>
            <tr data-print-section style={{ height: DETAIL_ROW_HEIGHT }}>
              <td />
              <td style={{ textAlign: "center", verticalAlign: "middle", fontWeight: 700 }}>合計</td>
              <td colSpan={2} style={{ padding: "0 6px", textAlign: "right", verticalAlign: "middle", fontSize: 13.5, fontWeight: 700, border: CELL_BORDER }}>
                {yen(estimate.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
