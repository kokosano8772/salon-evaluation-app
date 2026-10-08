// html2canvasはcanvas上に文字を自前で再描画する方式で、CJK(日本語)テキストに
// アルファベット用のベースラインを使ってしまう既知の制限があり、文字が行の中で
// 下にズレて描画される（広告レポートPNG出力で発生・修正済みと同じ不具合）。
// html-to-imageはDOMをSVGのforeignObject内に埋め込んでブラウザ本来の描画エンジンで
// レンダリングするため、この種のズレが原理的に起きない。
//
// 価値診断（DiagnosisResult）専用だった関数を、ファイル名を呼び出し側で組み立てて
// 渡す形に汎用化（Salon AI Check Phase 2でも同じキャプチャ/改ページロジックを
// 再利用するため。型はDiagnosisResultに依存しない）。
export async function exportResultToPDF(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // dynamic import — SSR 非対応ライブラリのため実行時のみ読み込む
  const [{ default: jsPDF }, { toCanvas }] = await Promise.all([
    import("jspdf"),
    import("html-to-image"),
  ]);

  // Webフォント(Noto Sans JP)がまだ使われていないウェイトだと document.fonts.ready を
  // 待つだけでは不十分なため、実際に使うウェイトを明示的にloadしてから待つ。
  if (typeof document.fonts?.load === "function") {
    await Promise.all(
      [400, 500, 600, 700].map((weight) => document.fonts.load(`${weight} 16px "Noto Sans JP"`).catch(() => {}))
    );
  }
  if (typeof document.fonts?.ready?.then === "function") {
    await document.fonts.ready;
  }

  // キャプチャ前の生DOMから、各セクション（カード単位）の開始位置を控えておく。
  // 後でページの高さ単位に機械的に切り分けると、カードの途中でページが割れてしまう
  // ことがあるため、実際の切り分け時はこの境界の直前で改ページするようにする。
  const pixelRatio = 2;
  const elementTop = element.getBoundingClientRect().top;
  const sectionBoundaries = Array.from(element.querySelectorAll<HTMLElement>("[data-print-section]"))
    .map((el) => Math.round((el.getBoundingClientRect().top - elementTop) * pixelRatio))
    .filter((y) => y > 0)
    .sort((a, b) => a - b);

  const canvas = await toCanvas(element, {
    pixelRatio,
    cacheBust: true,
    backgroundColor: "#FAF8F3",
    // Google Fontsをクロスオリジンの<link>で読み込んでいるため、埋め込みを試みると
    // CORSエラーになる。ブラウザ側で読み込み済み（上でreadyを待機済み）なので不要。
    skipFonts: true,
  });

  // A4サイズのPDFに収まるよう、キャプチャした画像をページの高さ単位で縦に切り分け、
  // 複数ページとして追加する（1枚の縦に長いだけの非標準サイズページにはしない）。
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();
  const pxPerMm = canvas.width / pageWidthMm;
  const pageHeightPx = Math.round(pageHeightMm * pxPerMm);

  const sliceCanvas = document.createElement("canvas");
  sliceCanvas.width = canvas.width;
  const ctx = sliceCanvas.getContext("2d");
  if (!ctx) throw new Error("PDF生成用のcanvasコンテキストを取得できませんでした");

  let renderedPx = 0;
  let pageIndex = 0;
  while (renderedPx < canvas.height) {
    const maxSliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx);
    const idealCut = renderedPx + maxSliceHeightPx;
    // このページに収まる範囲で一番下にあるセクション境界を探し、そこで改ページする。
    // 1セクションが1ページより大きい場合は境界が見つからないので、従来通り固定高さで切る。
    const safeCut = sectionBoundaries
      .filter((y) => y > renderedPx && y <= idealCut)
      .pop();
    const sliceHeightPx = (safeCut ?? idealCut) - renderedPx;
    sliceCanvas.height = sliceHeightPx;
    ctx.clearRect(0, 0, sliceCanvas.width, sliceHeightPx);
    ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

    if (pageIndex > 0) pdf.addPage();
    const sliceHeightMm = sliceHeightPx / pxPerMm;
    // JPEGで出力してファイルサイズを抑える（PNGのままだと背景色の塗りつぶしだけで
    // 数MB/ページに膨らみ、メール添付や閲覧に支障が出るレベルになるため）。
    // 背景は常に不透明（#FAF8F3）なのでアルファ透過は不要で、JPEGの非可逆圧縮による
    // 見た目への影響もこの種のフラットなレイアウトではほぼ気にならない。
    pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageWidthMm, sliceHeightMm);

    renderedPx += sliceHeightPx;
    pageIndex++;
  }

  pdf.save(filename);
}
