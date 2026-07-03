"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BasicInfoForm, { BasicInfoValue } from "@/components/growth-db/forms/BasicInfoForm";
import { useStore } from "@/lib/growth-db/hooks";
import * as repo from "@/lib/growth-db/repository";

export default function EditStorePage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = use(params);
  const router = useRouter();
  const { store, loading } = useStore(storeId);
  const [value, setValue] = useState<BasicInfoValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (store) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = store;
      setValue(rest);
    }
  }, [store]);

  if (loading || !value) {
    return <div className="card-luxury p-12 h-64 animate-pulse bg-gray-50" />;
  }

  const handleSubmit = async () => {
    if (!value.name.trim()) return;
    setSubmitting(true);
    await repo.updateStore(storeId, value);
    router.push(`/dashboard/stores/${storeId}`);
  };

  const handleDelete = async () => {
    if (!store) return;
    const confirmed = window.confirm(
      `「${store.name}」を削除します。月次データ・診断連携履歴もすべて失われ、元に戻せません。よろしいですか？`
    );
    if (!confirmed) return;
    setDeleting(true);
    await repo.deleteStore(storeId);
    router.push("/dashboard/stores");
  };

  return (
    <div>
      <DashboardHeader
        title="店舗情報を編集"
        breadcrumbs={[
          { label: "ダッシュボード", href: "/dashboard" },
          { label: "成長データベース", href: "/dashboard/stores" },
          { label: store?.name ?? "", href: `/dashboard/stores/${storeId}` },
          { label: "編集" },
        ]}
      />

      <div className="max-w-2xl">
        <BasicInfoForm value={value} onChange={setValue} />

        <button
          onClick={handleSubmit}
          disabled={submitting || !value.name.trim()}
          className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          {submitting ? "保存中..." : "保存する"}
        </button>

        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">危険な操作</p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={15} strokeWidth={2} />
            {deleting ? "削除中..." : "この店舗を削除する"}
          </button>
          <p className="text-xs text-gray-400 mt-2">
            月次データ・診断連携履歴を含め、Supabase上のデータも完全に削除されます。元に戻せません。
          </p>
        </div>
      </div>
    </div>
  );
}
