"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Bot, ClipboardCheck, Store as StoreIcon } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface VaultItem {
  kind: "ai_check" | "value_diagnosis";
  id: string;
  title: string;
  score: number;
  scoreMax: number;
  rank: string | null;
  tier: string | null;
  occurredAt: string;
  matchedStore: { id: string; name: string } | null;
  href: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function KindBadge({ item }: { item: VaultItem }) {
  if (item.kind === "ai_check") {
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
        <Bot size={11} strokeWidth={2} />
        AIチェック{item.tier === "pro" ? "（プロ）" : "（簡易）"}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
      <ClipboardCheck size={11} strokeWidth={2} />
      価値診断
    </span>
  );
}

export default function DiagnosisVaultPage() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/growth-db/diagnosis-vault")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "取得に失敗しました");
        setItems(json.results as VaultItem[]);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <DashboardHeader
        title="診断結果の保管庫"
        description="AIチェック・価値診断の結果を、実施順にまとめて確認できます。"
        breadcrumbs={[{ label: "ダッシュボード", href: "/dashboard" }, { label: "診断結果の保管庫" }]}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-luxury p-4 h-[76px] animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : error ? (
        <div className="card-luxury p-12 text-center text-gray-400 text-sm">{error}</div>
      ) : items.length === 0 ? (
        <div className="card-luxury p-12 text-center text-gray-400 text-sm">
          まだ診断結果がありません。
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={`${item.kind}-${item.id}`}
              className="card-luxury p-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <KindBadge item={item} />
                  <span className="text-xs text-gray-400">{formatDate(item.occurredAt)}実施</span>
                </div>
                <p className="text-sm font-semibold text-charcoal-900 truncate">
                  {item.title}
                  {item.rank && <span className="font-normal text-gray-400">（{item.rank}ランク）</span>}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.score}/{item.scoreMax}点
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {item.matchedStore ? (
                  <Link
                    href={`/dashboard/stores/${item.matchedStore.id}`}
                    target="_blank"
                    className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-200 hover:bg-green-100"
                  >
                    <StoreIcon size={12} strokeWidth={2} />
                    {item.matchedStore.name}と連携
                  </Link>
                ) : (
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 text-gray-400 border border-gray-200">
                    成長DB未登録
                  </span>
                )}
                <Link
                  href={item.href}
                  target="_blank"
                  title="詳細を見る"
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-charcoal-600 hover:bg-gray-50 shrink-0"
                >
                  <ArrowUpRight size={14} strokeWidth={2} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
