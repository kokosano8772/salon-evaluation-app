import { DiagnosisResult } from "./types";
import { RANK_INFO } from "./scoring";

export async function exportResultToPDF(
  element: HTMLElement,
  result: DiagnosisResult
): Promise<void> {
  // dynamic import — SSR 非対応ライブラリのため実行時のみ読み込む
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const rankInfo = RANK_INFO[result.rank];

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#FAF8F3",
    logging: false,
    // スクロール位置にかかわらず要素全体をキャプチャ
    scrollY: -window.scrollY,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // PDF ページサイズをコンテンツに合わせる（モバイル縦向き比率を維持）
  const pdfWidth = 390;
  const pdfHeight = Math.round((imgHeight / imgWidth) * pdfWidth);

  const pdf = new jsPDF({
    orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
    unit: "px",
    format: [pdfWidth, pdfHeight],
    hotfixes: ["px_scaling"],
  });

  pdf.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    0,
    0,
    pdfWidth,
    pdfHeight
  );

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  pdf.save(`SVS_${result.totalScore}pt_${rankInfo.rank}_${date}.pdf`);
}
