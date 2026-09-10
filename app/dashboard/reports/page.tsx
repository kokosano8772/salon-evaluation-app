"use client";

import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AllStoresBulkSyncPanel from "@/components/growth-db/ads/AllStoresBulkSyncPanel";
import { currentYearMonth, shiftYearMonth } from "@/lib/growth-db/format";
import { AD_PLATFORM_LABEL, AD_REPORT_CATEGORY_LABEL, AdPlatform, AdReportCategory } from "@/lib/growth-db/ad-report-types";

const PLATFORMS: AdPlatform[] = ["google", "meta"];
const CATEGORIES: AdReportCategory[] = ["acquisition", "recruitment"];

export default function ReportsPage() {
  const [platform, setPlatform] = useState<AdPlatform>("google");
  const [category, setCategory] = useState<AdReportCategory>("acquisition");
  // 広告レポートは前月分を見るのが基本のため、デフォルトも当月ではなく前月にする
  const [yearMonth, setYearMonth] = useState(shiftYearMonth(currentYearMonth(), -1));

  return (
    <div>
      <DashboardHeader
        title="レポート"
        breadcrumbs={[{ label: "ダッシュボード", href: "/dashboard" }, { label: "レポート" }]}
        actions={
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => e.target.value && setYearMonth(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#C4788A]"
          />
        }
      />

      <div className="flex items-center gap-1 mb-6 border-b border-gray-100">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setPlatform(p);
              setCategory("acquisition");
            }}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              platform === p ? "border-[#C4788A] text-[#C4788A]" : "border-transparent text-gray-400 hover:text-charcoal-900"
            }`}
          >
            {AD_PLATFORM_LABEL[p]}
          </button>
        ))}
      </div>

      {platform === "google" && (
        <div className="flex items-center gap-1 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === c ? "bg-[#C4788A] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {AD_REPORT_CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      )}

      <AllStoresBulkSyncPanel
        key={`${platform}-${platform === "google" ? category : "acquisition"}-${yearMonth}`}
        platform={platform}
        category={platform === "google" ? category : "acquisition"}
        yearMonth={yearMonth}
      />
    </div>
  );
}
