"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { BotSummary } from "@/components/chatbot/types";

interface StoreOption {
  id: string;
  name: string;
}

const STATUS_LABEL: Record<BotSummary["status"], string> = {
  draft: "下書き",
  published: "公開中",
  archived: "停止",
};

const STATUS_STYLE: Record<BotSummary["status"], string> = {
  draft: "bg-gray-100 text-gray-600",
  published: "bg-green-100 text-green-700",
  archived: "bg-red-50 text-red-500",
};

export default function ChatbotListPage() {
  const [bots, setBots] = useState<BotSummary[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState("");

  const refresh = () => {
    fetch("/api/chatbot/admin/bots")
      .then((r) => r.json())
      .then((json) => setBots(json.bots ?? []));
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/chatbot/admin/bots").then((r) => r.json()),
      fetch("/api/chatbot/admin/stores").then((r) => r.json()),
    ])
      .then(([botsRes, storesRes]) => {
        setBots(botsRes.bots ?? []);
        setStores(storesRes.stores ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  const storesWithoutBot = useMemo(() => {
    const existingStoreIds = new Set(bots.map((b) => b.storeId));
    return stores.filter((s) => !existingStoreIds.has(s.id));
  }, [bots, stores]);

  const handleCreate = async () => {
    if (!selectedStoreId) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/chatbot/admin/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: selectedStoreId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "作成に失敗しました");
      setSelectedStoreId("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <DashboardHeader
        title="求人チャットボット"
        description="サロンごとの求人チャットボットの設定・公開状況を管理します。"
        breadcrumbs={[{ label: "ダッシュボード", href: "/dashboard" }, { label: "求人チャットボット" }]}
      />

      <div className="card-luxury p-5 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm bg-white"
          >
            <option value="">店舗を選択して新規作成...</option>
            {storesWithoutBot.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} strokeWidth={2} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <button
          onClick={handleCreate}
          disabled={!selectedStoreId || creating}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
        >
          <Plus size={16} />
          追加
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="card-luxury p-12 h-48 animate-pulse bg-gray-50" />
      ) : bots.length === 0 ? (
        <div className="card-luxury p-12 text-center text-sm text-gray-400">まだチャットボットが作成されていません。</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <Link
              key={bot.id}
              href={`/dashboard/chatbot/${bot.storeId}`}
              className="card-luxury p-5 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-charcoal-900">{bot.storeName}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[bot.status]}`}>
                  {STATUS_LABEL[bot.status]}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {bot.mode === "choice" ? "選択式のみ" : bot.mode === "ai" ? "AIのみ" : "選択式+AI"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
