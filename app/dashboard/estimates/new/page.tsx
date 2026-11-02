"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EstimateBuilder from "@/components/estimates/EstimateBuilder";

export default function NewEstimatePage() {
  return (
    <div>
      <DashboardHeader
        title="見積もり新規作成"
        description="価格表からチェックして、見積もりを作成します。"
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "見積もり一覧", href: "/dashboard/estimates" },
          { label: "新規作成" },
        ]}
      />
      <EstimateBuilder mode="new" />
    </div>
  );
}
