// 広告レポート画面（1ページ目/2ページ目）をPDFファイルとして直接ダウンロードする。
// lib/pdf.ts（診断結果PDF）と同じjsPDF + html2canvasの方式を踏襲しつつ、
// .ad-report-page 単位で複数ページのPDFに分割する。

export async function exportAdReportToPdf(container: HTMLElement, fileName: string): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const pages = Array.from(container.querySelectorAll<HTMLElement>(".ad-report-page"));
  if (pages.length === 0) return;

  let pdf: InstanceType<typeof jsPDF> | null = null;

  for (const page of pages) {
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#F3F2EF",
      logging: false,
      // ページ要素の実サイズ（スクロール外の部分も含む）のみをキャプチャする。
      // 省略すると現在の表示ビューポート基準になり、右側が切れたり
      // 余分な余白まで含めてキャプチャされたりする。
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: page.scrollWidth,
      windowHeight: page.scrollHeight,
      width: page.scrollWidth,
      height: page.scrollHeight,
    });

    const pdfWidth = 794; // A4相当のpx幅（96dpi）
    const pdfHeight = Math.round((canvas.height / canvas.width) * pdfWidth);

    if (!pdf) {
      pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [pdfWidth, pdfHeight],
        hotfixes: ["px_scaling"],
      });
    } else {
      pdf.addPage([pdfWidth, pdfHeight], "portrait");
    }

    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pdfWidth, pdfHeight);
  }

  pdf?.save(fileName);
}
