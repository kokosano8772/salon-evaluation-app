"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DiagnosisReportDocument from "@/components/growth-db/store-detail/DiagnosisReportDocument";
import { useDiagnosisResults, useStore } from "@/lib/growth-db/hooks";
import { generateImprovements } from "@/lib/recommendations";
import { RANK_INFO } from "@/lib/scoring";

interface DiagnosisReportPageProps {
  params: Promise<{ storeId: string; diagnosisId: string }>;
}

export default function DiagnosisReportPage({ params }: DiagnosisReportPageProps) {
  const { storeId, diagnosisId } = use(params);
  const { store, loading: storeLoading } = useStore(storeId);
  const { items, loading: itemsLoading } = useDiagnosisResults(storeId);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (storeLoading || itemsLoading || !store) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  const item = items.find((i) => i.id === diagnosisId);
  if (!item) {
    return (
      <div className="card-luxury p-12 text-center text-sm text-gray-400">
        診断結果が見つかりませんでした。
        <Link href={`/dashboard/stores/${store.id}`} className="block mt-2 font-medium" style={{ color: "#C4788A" }}>
          店舗詳細に戻る
        </Link>
      </div>
    );
  }

  const rankInfo = RANK_INFO[item.rank];
  const improvements = generateImprovements(item.categoryScores);

  // PDF保存は以前ブラウザのネイティブ印刷（window.print + @page CSS）を使っていたが、
  // 実機の印刷ダイアログ（「PDFに保存」含む）がカスタムの@pageサイズを確実には尊重せず、
  // Letter等の標準用紙サイズにそのまま収めようとして右側が切れたり、高さがページ内に
  // 収まらず余分なページに分割されたりする不具合があった（Salon AI CheckのPDF保存で
  // 判明したのと同じ不具合）。ブラウザの印刷パイプラインに依存せず、html-to-image
  // （lib/pdf.ts参照）で各ページ（.ad-report-page）をcanvasとして直接キャプチャし、
  // キャプチャした実寸ぴったりのサイズでjsPDFの各ページを作ることで、用紙サイズの
  // 判定を完全に自前で制御する。
  //
  // .ad-report-pageはmx-autoで中央寄せしており、html-to-imageはキャプチャ対象の
  // computed style（margin込み）をそのままクローンに焼き付けてしまう一方、
  // キャプチャ用キャンバスの幅は要素自身のclientWidth（900px、marginは含まない）で
  // 決まるため、mx-autoで付くmargin-leftの分だけ中身が右にずれてクローン内で
  // 右端がはみ出し、はみ出した分だけ右側が欠けて見える不具合があった
  // （実機の画面幅が広く中央寄せの余白が大きいほど欠ける量も増える）。
  // キャプチャ直前だけ対象要素自身のmarginを0にして回避する。
  const handlePdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const [{ default: jsPDF }, { toCanvas }] = await Promise.all([import("jspdf"), import("html-to-image")]);

      if (typeof document.fonts?.load === "function") {
        await Promise.all(
          [400, 500, 600, 700].map((weight) => document.fonts.load(`${weight} 16px "Noto Sans JP"`).catch(() => {}))
        );
      }
      if (typeof document.fonts?.ready?.then === "function") {
        await document.fonts.ready;
      }

      const pageEls = Array.from(document.querySelectorAll<HTMLElement>(".ad-report-page"));
      const marginOverrides = pageEls.map((el) => ({
        el,
        marginLeft: el.style.marginLeft,
        marginRight: el.style.marginRight,
      }));
      pageEls.forEach((el) => {
        el.style.marginLeft = "0";
        el.style.marginRight = "0";
      });

      const pixelRatio = 2;
      const pxToPt = 0.75; // 96dpi(css px) -> 72dpi(pt)
      const canvases = [];
      try {
        for (const el of pageEls) {
          canvases.push(await toCanvas(el, { pixelRatio, cacheBust: true, backgroundColor: "#FAF8F3", skipFonts: true }));
        }
      } finally {
        marginOverrides.forEach(({ el, marginLeft, marginRight }) => {
          el.style.marginLeft = marginLeft;
          el.style.marginRight = marginRight;
        });
      }

      const firstWidthPt = (canvases[0].width / pixelRatio) * pxToPt;
      const firstHeightPt = (canvases[0].height / pixelRatio) * pxToPt;
      const pdf = new jsPDF({ unit: "pt", format: [firstWidthPt, firstHeightPt] });
      canvases.forEach((canvas, i) => {
        const widthPt = (canvas.width / pixelRatio) * pxToPt;
        const heightPt = (canvas.height / pixelRatio) * pxToPt;
        if (i > 0) pdf.addPage([widthPt, heightPt]);
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, widthPt, heightPt);
      });

      pdf.save(`${store.name}-診断レポート-${item.completedAt.slice(0, 10).replace(/-/g, "")}.pdf`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div>
      <div className="ad-report-print-hide">
        <DashboardHeader
          title={`${store.name} - 診断レポート`}
          breadcrumbs={[
            { label: "ダッシュボード", href: "/dashboard" },
            { label: "成長データベース", href: "/dashboard/stores" },
            { label: store.name, href: `/dashboard/stores/${store.id}` },
            { label: "診断レポート" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handlePdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-charcoal-700 hover:bg-gray-50 disabled:opacity-60"
              >
                <Download size={15} strokeWidth={2} />
                {isGeneratingPdf ? "生成中..." : "PDFで保存"}
              </button>
              <Link
                href={`/dashboard/stores/${store.id}`}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-charcoal-700 hover:bg-gray-50"
              >
                店舗詳細に戻る
              </Link>
            </div>
          }
        />
      </div>

      <div className="overflow-x-auto">
        <DiagnosisReportDocument
          salonName={item.salonName}
          completedAt={item.completedAt}
          totalScore={item.totalScore}
          rank={item.rank}
          rankInfo={rankInfo}
          categoryScores={item.categoryScores}
          improvements={improvements}
          answers={item.answers}
        />
      </div>
    </div>
  );
}
