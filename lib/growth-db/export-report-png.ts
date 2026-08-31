// 広告レポート（Meta・Google共通、集客/求人カテゴリも同じ仕組み）を
// ページごとにPNG画像として保存する。lib/pdf.ts の html2canvas 呼び出しパターンを踏襲。
export async function exportAdReportPagesAsPng(fileNamePrefix: string): Promise<void> {
  // dynamic import — SSR非対応ライブラリのため実行時のみ読み込む
  const { default: html2canvas } = await import("html2canvas");

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
