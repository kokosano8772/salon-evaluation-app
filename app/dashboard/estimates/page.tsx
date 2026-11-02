"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { formatYen } from "@/components/estimates/types";

interface EstimateListItem {
  id: string;
  title: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  clientName: string;
  storeId: string | null;
  total: number;
  validUntil: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<EstimateListItem["status"], { label: string; bg: string; text: string }> = {
  draft: { label: "下書き", bg: "bg-gray-50", text: "text-gray-500" },
  sent: { label: "送付済み", bg: "bg-blue-50", text: "text-blue-600" },
  accepted: { label: "成約", bg: "bg-green-50", text: "text-green-600" },
  rejected: { label: "失注", bg: "bg-red-50", text: "text-red-500" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function EstimatesListPage() {
  const [estimates, setEstimates] = useState<EstimateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/estimates")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "取得に失敗しました");
        setEstimates(json.estimates as EstimateListItem[]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <DashboardHeader
        title="見積もり一覧"
        description="作成した見積もりを一覧で確認できます。"
        breadcrumbs={[{ label: "ダッシュボード", href: "/dashboard" }, { label: "見積もり一覧" }]}
        actions={
          <Link
            href="/dashboard/estimates/new"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
          >
            <Plus size={15} strokeWidth={2.5} />
            新規作成
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-luxury p-4 h-[72px] animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : error ? (
        <div className="card-luxury p-12 text-center text-gray-400 text-sm">{error}</div>
      ) : estimates.length === 0 ? (
        <div className="card-luxury p-12 text-center text-gray-400 text-sm">
          まだ見積もりがありません。
          <div className="mt-4">
            <Link href="/dashboard/estimates/new" className="font-semibold" style={{ color: "#C4788A" }}>
              最初の見積もりを作成する
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {estimates.map((e) => {
            const status = STATUS_LABEL[e.status];
            return (
              <Link
                key={e.id}
                href={`/dashboard/estimates/${e.id}`}
                className="card-luxury p-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(e.createdAt)}作成</span>
                  </div>
                  <p className="text-sm font-semibold text-charcoal-900 truncate">{e.title || "（件名未設定）"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{e.clientName || "クライアント未設定"}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <p className="text-base font-bold" style={{ color: "#C4788A" }}>
                    {formatYen(e.total)}
                  </p>
                  <ArrowUpRight size={16} strokeWidth={2} className="text-gray-300" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
