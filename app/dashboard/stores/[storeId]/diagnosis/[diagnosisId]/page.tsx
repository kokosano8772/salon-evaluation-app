"use client";

import { use } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
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

  // 印刷/PDF保存ダイアログが提示するファイル名候補はdocument.titleから決まるため、
  // 印刷直前だけ差し替え、閉じたら元に戻す。ページ毎に高さが違うと短い方に余白が
  // 残ってしまうため、長い方に高さを揃えてから@pageをその高さに合わせる
  // （Google広告レポートの印刷と同じ仕組み）。
  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `${store.name}-診断レポート-${item.completedAt.slice(0, 10).replace(/-/g, "")}`;

    const pages = Array.from(document.querySelectorAll<HTMLElement>(".ad-report-page"));
    const maxHeight = Math.max(0, ...pages.map((el) => el.offsetHeight));
    let printSizeStyle: HTMLStyleElement | null = null;
    const heightOverrides: { el: HTMLElement; original: string }[] = [];
    if (maxHeight > 0) {
      pages.forEach((el) => {
        if (el.offsetHeight < maxHeight) {
          heightOverrides.push({ el, original: el.style.minHeight });
          el.style.minHeight = `${maxHeight}px`;
        }
      });
      const printHeight = maxHeight + 3;
      printSizeStyle = document.createElement("style");
      printSizeStyle.textContent = `@media print { @page { size: 900px ${printHeight}px; margin: 0; } }`;
      document.head.appendChild(printSizeStyle);
    }

    const restore = () => {
      document.title = originalTitle;
      printSizeStyle?.remove();
      heightOverrides.forEach(({ el, original }) => {
        el.style.minHeight = original;
      });
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
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
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-charcoal-700 hover:bg-gray-50"
              >
                <Printer size={15} strokeWidth={2} />
                印刷・PDFで保存
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
        />
      </div>
    </div>
  );
}
