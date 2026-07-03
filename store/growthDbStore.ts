import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MonthlyMetrics, Store } from "@/lib/growth-db/types";
import { SEED_MONTHLY_METRICS, SEED_STORES } from "@/lib/growth-db/seed-data";

// 成長データベースのダミーDB本体（Zustand + localStorage永続化）。
// 直接importせず、必ず lib/growth-db/repository.ts 経由で読み書きすること。
// これが将来Supabaseへ差し替える際の境界になる。
interface GrowthDbState {
  stores: Record<string, Store>;
  monthlyMetrics: Record<string, MonthlyMetrics[]>; // storeId -> yearMonth昇順の配列
  initialized: boolean;

  init: () => void;
  setStore: (store: Store) => void;
  removeStore: (storeId: string) => void;
  setMonthlyMetrics: (storeId: string, list: MonthlyMetrics[]) => void;
}

const initialState = {
  stores: {} as Record<string, Store>,
  monthlyMetrics: {} as Record<string, MonthlyMetrics[]>,
  initialized: false,
};

export const useGrowthDbStore = create<GrowthDbState>()(
  persist(
    (set) => ({
      ...initialState,

      init: () => {
        set((state) => {
          if (state.initialized) return state;
          return {
            stores: Object.fromEntries(SEED_STORES.map((s) => [s.id, s])),
            monthlyMetrics: { ...SEED_MONTHLY_METRICS },
            initialized: true,
          };
        });
      },

      setStore: (store) => {
        set((state) => ({ stores: { ...state.stores, [store.id]: store } }));
      },

      removeStore: (storeId) => {
        set((state) => {
          const stores = { ...state.stores };
          const monthlyMetrics = { ...state.monthlyMetrics };
          delete stores[storeId];
          delete monthlyMetrics[storeId];
          return { stores, monthlyMetrics };
        });
      },

      setMonthlyMetrics: (storeId, list) => {
        set((state) => ({
          monthlyMetrics: { ...state.monthlyMetrics, [storeId]: list },
        }));
      },
    }),
    {
      name: "salon-growth-db",
      partialize: (state) => ({
        stores: state.stores,
        monthlyMetrics: state.monthlyMetrics,
        initialized: state.initialized,
      }),
    }
  )
);
