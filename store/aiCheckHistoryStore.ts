import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AiCheckRank } from "@/lib/ai-check/types";

// Salon AI Checkはログイン不要の公開ツール（Phase 1で確定済み）のため、
// store/quickStore.tsと同じzustand/persist(localStorage)方式で、診断履歴を
// アカウント無しでブラウザ内に保持する。サーバー側には履歴の概念を持たせない。
export interface AiCheckHistoryEntry {
  id: string;
  url: string;
  totalScore: number;
  rank: AiCheckRank;
  createdAt: string;
}

const MAX_ENTRIES = 20;

interface AiCheckHistoryState {
  entries: AiCheckHistoryEntry[];
  addEntry: (entry: AiCheckHistoryEntry) => void;
  clear: () => void;
}

export const useAiCheckHistoryStore = create<AiCheckHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) => {
        set((state) => ({
          entries: [entry, ...state.entries.filter((e) => e.id !== entry.id)].slice(0, MAX_ENTRIES),
        }));
      },
      clear: () => set({ entries: [] }),
    }),
    {
      name: "salon-ai-check-history",
    }
  )
);
