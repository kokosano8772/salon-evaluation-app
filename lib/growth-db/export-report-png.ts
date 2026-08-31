// 広告レポート（Meta・Google共通、集客/求人カテゴリも同じ仕組み）を
// ページごとにPNG画像として保存する。
//
// html2canvasはcanvas上に文字を自前で再描画する方式で、CJK(日本語)テキストに
// アルファベット用のベースラインを使ってしまう既知の制限があり、実際に文字が
// 行の中で下にズレて描画される不具合が発生した。html-to-imageはDOMをSVGの
// foreignObject内に埋め込んでブラウザ本来の描画エンジンでレンダリングする方式のため、
// この種のベースラインのズレが原理的に起きない。
export async function exportAdReportPagesAsPng(fileNamePrefix: string): Promise<void> {
  // dynamic import — SSR非対応ライブラリのため実行時のみ読み込む
  const { toPng } = await import("html-to-image");

  // Webフォント(Noto Sans JP)はapp/layout.tsxでGoogle Fontsの外部スタイルシートから
  // display=swap で読み込んでいるため、まだ一度もこのウェイトが使われていないページでは
  // document.fonts.ready を待つだけでは不十分（フォントの読み込みが「まだ開始すらしていない」
  // 状態だと、待つべき読み込みが無いままreadyが解決してしまう）。実際に使っているウェイトを
  // 明示的にloadしてから、改めてreadyを待つ。
  if (typeof document.fonts?.load === "function") {
    await Promise.all(
      [300, 400, 500, 600, 700].map((weight) => document.fonts.load(`${weight} 16px "Noto Sans JP"`).catch(() => {}))
    );
  }
  if (typeof document.fonts?.ready?.then === "function") {
    await document.fonts.ready;
  }

  const pages = Array.from(document.querySelectorAll<HTMLElement>(".ad-report-page"));
  if (pages.length === 0) return;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // .ad-report-page は mx-auto（margin-left/right: auto）で中央寄せしているが、
    // html-to-imageがクローンしてSVGのforeignObject内に描画する際、このautoマージンが
    // foreignObject自身の幅ではなく実際のビューポート幅を基準に計算されてしまい、
    // 要素が右にずれて右端が欠け、左に余分な透明の余白が入る不具合があった。
    // また2ページ目はspace-y-8により兄弟要素として margin-top も付与されており、
    // これも同様にキャプチャ結果の上部に余分な透明の余白として写り込む。
    // クローン後に上書きしても直らなかったため、キャプチャの瞬間だけ本物のDOM要素自体の
    // marginを0にして、キャプチャ後に元に戻す。
    const originalMargin = page.style.margin;
    page.style.margin = "0";

    let dataUrl: string;
    try {
      dataUrl = await toPng(page, {
        pixelRatio: 2,
        cacheBust: true,
        // Google Fontsをクロスオリジンの<link>で読み込んでいるため、html-to-imageが
        // フォントをSVGに埋め込もうとCSSRulesを読もうとするとCORSエラーで失敗する。
        // ブラウザ側で既にフォントは読み込み・適用済み（document.fonts.readyを待機済み）
        // なので、埋め込み自体は不要のためスキップする。
        skipFonts: true,
      });
    } finally {
      page.style.margin = originalMargin;
    }

    const fileName = pages.length > 1 ? `${fileNamePrefix}-${i + 1}.png` : `${fileNamePrefix}.png`;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
