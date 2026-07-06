"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CompetitorSessionSummary } from "@/lib/growth-db/competitor-repository";

const MODE_LABEL: Record<CompetitorSessionSummary["mode"], string> = {
  attraction: "集客分析",
  recruitment: "求人分析",
  both: "集客・求人分析",
};

interface CompetitorSessionListProps {
  sessions: CompetitorSessionSummary[];
  loading: boolean;
  onOpen: (sessionId: string) => void;
  onDelete: (sessionId: string) => Promise<void>;
  onCreateNew: () => void;
}

export default function CompetitorSessionList({ sessions, loading, onOpen, onDelete, onCreateNew }: CompetitorSessionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm("このセッションを削除します。よろしいですか？")) return;
    setDeletingId(sessionId);
    await onDelete(sessionId);
    setDeletingId(null);
  };

  if (loading) {
    return <div className="card-luxury p-12 h-40 animate-pulse bg-gray-50" />;
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onCreateNew}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)" }}
      >
        <Plus size={16} strokeWidth={2.5} />
        新規に競合分析を始める
      </button>

      {sessions.length === 0 ? (
        <div className="card-luxury p-12 text-center text-gray-400 text-sm">
          まだ競合分析の履歴がありません。
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onOpen(s.id)}
              className="card-luxury w-full p-4 flex items-center justify-between gap-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-charcoal-900">{s.region}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {MODE_LABEL[s.mode]} ／ 競合{s.competitorCount}社 ／ 更新: {new Date(s.updatedAt).toLocaleDateString("ja-JP")}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, s.id)}
                disabled={deletingId === s.id}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                title="削除"
              >
                <Trash2 size={15} />
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
