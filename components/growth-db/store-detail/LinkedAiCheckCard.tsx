"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, ExternalLink } from "lucide-react";

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

// 診断結果の保管庫（/dashboard/vault、app/api/growth-db/diagnosis-vault）が
// 持つURL自動連携・手動連携の結果を、この店舗に該当する分だけ絞り込んで表示する
// カード。マッチング・連携ロジック自体は保管庫側に一本化し、ここでは参照のみ
// 行う（二重実装を避けるため）。詳細・PDF保存は既存の/ai-check/[id]にそのまま
// 任せ、ここではレポートへのリンクのみ提供する（LinkedDiagnosisCardと同じ方針）。
export default function LinkedAiCheckCard({ storeId }: { storeId: string }) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/growth-db/diagnosis-vault")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "取得に失敗しました");
        const results = json.results as VaultItem[];
        setItems(results.filter((i) => i.kind === "ai_check" && i.matchedStore?.id === storeId));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading || items.length === 0) return null;

  return (
    <div className="card-luxury p-5">
      <p className="text-xs font-medium text-gray-400 tracking-wide mb-4 flex items-center gap-1.5">
        <Bot size={14} strokeWidth={2} />
        AIチェックの連携結果（参考情報・独自診断スコアには反映されません）
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            target="_blank"
            className="flex items-center justify-between gap-3 px-4 py-3 border border-gray-100 rounded-xl hover:bg-gray-50"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-charcoal-900 truncate">
                {item.score}/{item.scoreMax}点
                {item.rank && <span className="font-normal text-gray-400">（{item.rank}ランク）</span>}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(item.occurredAt)}実施・{item.tier === "pro" ? "プロ診断" : "簡易診断"}
              </p>
            </div>
            <ExternalLink size={14} strokeWidth={2} className="text-gray-400 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
