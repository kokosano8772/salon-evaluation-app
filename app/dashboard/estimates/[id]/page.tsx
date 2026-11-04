"use client";

import { Fragment, use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Pencil, Trash2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import EstimateBuilder from "@/components/estimates/EstimateBuilder";
import EstimatePrintDocument from "@/components/estimates/EstimatePrintDocument";
import { EstimateHeader, LineItem, StoreOption, formatYen, groupByCategory } from "@/components/estimates/types";
import { exportResultToPDF } from "@/lib/pdf";

const STATUS_OPTIONS: { value: EstimateHeader["status"]; label: string }[] = [
  { value: "draft", label: "下書き" },
  { value: "sent", label: "送付済み" },
  { value: "accepted", label: "成約" },
  { value: "rejected", label: "失注" },
];

export default function EstimateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [estimate, setEstimate] = useState<EstimateHeader | null>(null);
  const [store, setStore] = useState<StoreOption | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const refresh = () => {
    setLoading(true);
    fetch(`/api/estimates/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "取得に失敗しました");
        setEstimate(json.estimate as EstimateHeader);
        setStore(json.store as StoreOption | null);
        setLineItems(json.lineItems as LineItem[]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [id]);

  const handleStatusChange = async (status: EstimateHeader["status"]) => {
    if (!estimate) return;
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/estimates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "更新に失敗しました");
      setEstimate({ ...estimate, status });
    } catch (err) {
      alert(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setStatusBusy(false);
    }
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/estimates/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "削除に失敗しました");
      router.push("/dashboard/estimates");
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
      setDeleteBusy(false);
    }
  };

  const handlePdf = async () => {
    if (!printRef.current || isGeneratingPdf || !estimate) return;
    setIsGeneratingPdf(true);
    try {
      const date = new Date(estimate.createdAt).toISOString().slice(0, 10).replace(/-/g, "");
      await exportResultToPDF(printRef.current, `見積書_${estimate.title || "無題"}_${date}.pdf`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "PDFの生成に失敗しました");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  if (error || !estimate) {
    return (
      <div className="card-luxury p-12 text-center text-gray-400 text-sm">
        {error || "見積もりが見つかりませんでした"}
        <div className="mt-4">
          <Link href="/dashboard/estimates" className="font-semibold" style={{ color: "#C4788A" }}>
            見積もり一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  const clientLabel = store?.name ?? estimate.clientName ?? "";

  if (editing) {
    return (
      <div>
        <DashboardHeader
          title="見積もり編集"
          breadcrumbs={[
            { label: "ダッシュボード", href: "/dashboard" },
            { label: "見積もり一覧", href: "/dashboard/estimates" },
            { label: estimate.title || "見積もり" },
          ]}
        />
        <EstimateBuilder
          mode="edit"
          estimateId={id}
          initial={{
            title: estimate.title,
            notes: estimate.notes,
            productionDate: estimate.productionDate,
            taxRate: estimate.taxRate,
            storeId: estimate.storeId,
            clientName: estimate.clientName,
            clientContact: estimate.clientContact,
            lineItems,
          }}
        />
      </div>
    );
  }

  const groups = groupByCategory(lineItems);

  return (
    <div>
      <DashboardHeader
        title={estimate.title || "（件名未設定）"}
        description={clientLabel}
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "見積もり一覧", href: "/dashboard/estimates" },
          { label: estimate.title || "見積もり" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={estimate.status}
              disabled={statusBusy}
              onChange={(e) => handleStatusChange(e.target.value as EstimateHeader["status"])}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-[#C4788A]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={handlePdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-charcoal-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Download size={15} strokeWidth={2} />
              {isGeneratingPdf ? "作成中..." : "PDF保存"}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
            >
              <Pencil size={15} strokeWidth={2} />
              編集
            </button>
          </div>
        }
      />

      <div className="space-y-4">
        <div className="card-luxury p-5 flex flex-wrap gap-x-10 gap-y-3">
          <div>
            <p className="text-[11px] text-gray-400">宛先</p>
            <p className="text-sm font-semibold text-charcoal-900">{clientLabel || "未設定"}</p>
          </div>
          {estimate.clientContact && (
            <div>
              <p className="text-[11px] text-gray-400">連絡先</p>
              <p className="text-sm text-charcoal-700">{estimate.clientContact}</p>
            </div>
          )}
          {estimate.productionDate && (
            <div>
              <p className="text-[11px] text-gray-400">制作日</p>
              <p className="text-sm text-charcoal-700">{estimate.productionDate}</p>
            </div>
          )}
        </div>

        {groups.map((group) => (
          <div key={group.category} className="card-luxury overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-charcoal-700">{group.category}</p>
            </div>
            <table className="w-full">
              <tbody>
                {group.items.map((item, i) => {
                  const undiscountedUnitPrice = item.unitPrice + item.discountAmount;
                  return (
                    <Fragment key={item.id ?? i}>
                      <tr className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="px-5 py-3 text-sm text-charcoal-900">
                          {item.name}
                          {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                          {item.procurementCost > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">仕入れ料金 {formatYen(item.procurementCost)}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 text-right whitespace-nowrap">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-500 text-right whitespace-nowrap">
                          {formatYen(undiscountedUnitPrice)}
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-charcoal-900 text-right whitespace-nowrap">
                          {formatYen(undiscountedUnitPrice * item.quantity)}
                        </td>
                      </tr>
                      {item.discountAmount > 0 && (
                        <tr className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <td className="px-5 py-2 text-sm text-red-500" colSpan={3}>
                            {item.discountLabel}
                          </td>
                          <td className="px-5 py-2 text-sm font-semibold text-red-500 text-right whitespace-nowrap">
                            -{formatYen(item.discountAmount * item.quantity)}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        <div className="card-luxury p-5 ml-auto w-full sm:w-80">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">小計</span>
            <span className="text-charcoal-900">{formatYen(estimate.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm mb-3 pb-3 border-b border-gray-100">
            <span className="text-gray-500">消費税（{Math.round(estimate.taxRate * 100)}%）</span>
            <span className="text-charcoal-900">{formatYen(estimate.taxAmount)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-semibold text-charcoal-900">合計</span>
            <span className="text-xl font-bold" style={{ color: "#C4788A" }}>
              {formatYen(estimate.total)}
            </span>
          </div>
        </div>

        {estimate.notes && (
          <div className="card-luxury p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">備考</p>
            <p className="text-sm text-charcoal-700 whitespace-pre-wrap leading-relaxed">{estimate.notes}</p>
          </div>
        )}

        <div className="pt-2">
          {deleteConfirming ? (
            <div className="card-luxury p-4 flex items-center justify-between gap-3">
              <p className="text-xs text-red-500">この見積もりを完全に削除します。元に戻せません。</p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setDeleteConfirming(false)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  disabled={deleteBusy}
                  onClick={handleDelete}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {deleteBusy ? "削除中..." : "削除する"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setDeleteConfirming(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500"
            >
              <Trash2 size={13} strokeWidth={2} />
              この見積もりを削除する
            </button>
          )}
        </div>
      </div>

      {/* PDF保存専用の静止レイアウト。常にDOM上に置き、見た目には表示しない
          （app/(diagnosis)/result/page.tsxと同じ方式）。 */}
      <div style={{ position: "absolute", top: 0, left: -9999, width: 600, height: 0, overflow: "hidden" }} aria-hidden="true">
        <div ref={printRef}>
          <EstimatePrintDocument estimate={estimate} clientLabel={clientLabel || "お客様"} lineItems={lineItems} />
        </div>
      </div>
    </div>
  );
}
