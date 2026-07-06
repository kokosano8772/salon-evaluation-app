"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, Printer } from "lucide-react";
import { exportToCsv } from "@/lib/competitor-research/export/csv";
import { exportToExcel } from "@/lib/competitor-research/export/excel";
import { exportToPdf } from "@/lib/competitor-research/export/pdf";
import { AnalysisMode, ComparisonData, SalonData } from "@/lib/competitor-research/types";

interface CompetitorExportMenuProps {
  salons: SalonData[];
  mode: AnalysisMode;
  cellData: ComparisonData;
  region: string;
  aiResult?: string;
}

type ExportType = "pdf" | "csv" | "excel";

const ITEMS: { type: ExportType; label: string; desc: string; icon: typeof Printer }[] = [
  { type: "pdf", label: "PDFとして印刷", desc: "ブラウザの印刷→PDF保存", icon: Printer },
  { type: "csv", label: "CSVダウンロード", desc: "Excel/Numbersで開けます", icon: FileText },
  { type: "excel", label: "Excelダウンロード", desc: ".xlsx形式", icon: FileSpreadsheet },
];

export default function CompetitorExportMenu({ salons, mode, cellData, region, aiResult }: CompetitorExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<ExportType | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleExport(type: ExportType) {
    setLoading(type);
    setOpen(false);
    try {
      if (type === "pdf") exportToPdf(salons, mode, cellData, region, aiResult);
      else if (type === "csv") exportToCsv(salons, mode, cellData, region);
      else await exportToExcel(salons, mode, cellData, region);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:border-[#C4788A]/50 disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        出力
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 card-luxury overflow-hidden z-50">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400">出力形式を選択</p>
          </div>
          {ITEMS.map(({ type, label, desc, icon: Icon }) => (
            <button
              key={type}
              onClick={() => handleExport(type)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-[#C4788A]" />
              </div>
              <div>
                <p className="text-sm font-medium text-charcoal-900">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
