// 広告レポート（Meta・Google共通、集客/求人カテゴリも同じ仕組み）を
// ページごとにPNG画像として保存する。lib/pdf.ts の html2canvas 呼び出しパターンを踏襲。
export async function exportAdReportPagesAsPng(fileNamePrefix: string): Promise<void> {
  // dynamic import — SSR非対応ライブラリのため実行時のみ読み込む
  const { default: html2canvas } = await import("html2canvas");

  // Webフォント(Noto Sans JP)はapp/layout.tsxでGoogle Fontsの外部スタイルシートから
  // display=swap で読み込んでいるため、まだ一度もこのウェイトが使われていないページでは
  // document.fonts.ready を待つだけでは不十分（フォントの読み込みが「まだ開始すらしていない」
  // 状態だと、待つべき読み込みが無いままreadyが解決してしまう）。実際に使っているウェイトを
  // 明示的にloadしてから、改めてreadyを待つことで、フォールバックフォントの行の高さのまま
  // キャプチャしてしまい後から本物のフォントに差し替わって文章がズレる不具合を防ぐ。
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
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      // ページ自身が背景色を持っているため上書きせず、そのまま使う
      backgroundColor: null,
      logging: false,
      windowWidth: page.scrollWidth,
      windowHeight: page.scrollHeight,
    });

    const fileName = pages.length > 1 ? `${fileNamePrefix}-${i + 1}.png` : `${fileNamePrefix}.png`;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
