// 成長データベースの非同期CRUD窓口。
//
// 今日の実装は store/growthDbStore.ts（Zustand + localStorage）への薄いラッパーに過ぎないが、
// すべての関数を async にしておくことで、将来 Supabase 等の実バックエンドに差し替える際も
// 呼び出し側（コンポーネント）を一切変更せずに済む。コンポーネントは必ずこのファイル経由で
// データを読み書きし、useGrowthDbStore を直接importしないこと。

import { useGrowthDbStore } from "@/store/growthDbStore";
import { calculateGrowthScore } from "./scoring";
import { GrowthScore, MonthlyMetrics, Store } from "./types";

function ensureInitialized() {
  const state = useGrowthDbStore.getState();
  if (!state.initialized) {
    state.init();
  }
}

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface GetStoresParams {
  search?: string;
  area?: string;
  sortBy?: "name" | "area" | "score" | "updatedAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface GetStoresResult {
  items: Store[];
  total: number;
}

async function latestScoreFor(store: Store): Promise<number> {
  const history = useGrowthDbStore.getState().monthlyMetrics[store.id] ?? [];
  if (history.length === 0) return 0;
  const latest = history[history.length - 1];
  return calculateGrowthScore(store.id, latest.yearMonth, history, store.staffCount).totalScore;
}

export async function getStores(params: GetStoresParams = {}): Promise<GetStoresResult> {
  ensureInitialized();
  const { search, area, sortBy = "updatedAt", sortDir = "desc", page = 1, pageSize = 12 } = params;
  const state = useGrowthDbStore.getState();
  let items = Object.values(state.stores);

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    items = items.filter((s) => s.name.toLowerCase().includes(q));
  }
  if (area) {
    items = items.filter((s) => s.area === area);
  }

  if (sortBy === "score") {
    const scored = await Promise.all(items.map(async (s) => ({ store: s, score: await latestScoreFor(s) })));
    scored.sort((a, b) => (sortDir === "asc" ? a.score - b.score : b.score - a.score));
    items = scored.map((s) => s.store);
  } else {
    const dir = sortDir === "asc" ? 1 : -1;
    items = [...items].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "ja") * dir;
      if (sortBy === "area") return a.area.localeCompare(b.area, "ja") * dir;
      return (a.updatedAt < b.updatedAt ? -1 : a.updatedAt > b.updatedAt ? 1 : 0) * dir;
    });
  }

  const total = items.length;
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return { items: pageItems, total };
}

export async function getStore(storeId: string): Promise<Store | null> {
  ensureInitialized();
  return useGrowthDbStore.getState().stores[storeId] ?? null;
}

export async function createStore(input: Omit<Store, "id" | "createdAt" | "updatedAt">): Promise<Store> {
  ensureInitialized();
  const now = new Date().toISOString();
  const store: Store = { ...input, id: generateId("store"), createdAt: now, updatedAt: now };
  useGrowthDbStore.getState().setStore(store);
  useGrowthDbStore.getState().setMonthlyMetrics(store.id, []);
  return store;
}

export async function updateStore(storeId: string, patch: Partial<Store>): Promise<Store> {
  ensureInitialized();
  const current = useGrowthDbStore.getState().stores[storeId];
  if (!current) throw new Error(`Store not found: ${storeId}`);
  const updated: Store = { ...current, ...patch, id: current.id, updatedAt: new Date().toISOString() };
  useGrowthDbStore.getState().setStore(updated);
  return updated;
}

export async function deleteStore(storeId: string): Promise<void> {
  ensureInitialized();
  useGrowthDbStore.getState().removeStore(storeId);
}

export async function getMonthlyData(storeId: string, yearMonth: string): Promise<MonthlyMetrics | null> {
  ensureInitialized();
  const list = useGrowthDbStore.getState().monthlyMetrics[storeId] ?? [];
  return list.find((m) => m.yearMonth === yearMonth) ?? null;
}

export interface MonthlyRange {
  from?: string;
  to?: string;
}

export async function listMonthlyData(storeId: string, range?: MonthlyRange): Promise<MonthlyMetrics[]> {
  ensureInitialized();
  let list = [...(useGrowthDbStore.getState().monthlyMetrics[storeId] ?? [])];
  list.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
  if (range?.from) list = list.filter((m) => m.yearMonth >= range.from!);
  if (range?.to) list = list.filter((m) => m.yearMonth <= range.to!);
  return list;
}

export async function upsertMonthlyData(
  storeId: string,
  yearMonth: string,
  patch: Partial<Omit<MonthlyMetrics, "storeId" | "yearMonth">>
): Promise<MonthlyMetrics> {
  ensureInitialized();
  const state = useGrowthDbStore.getState();
  const list = [...(state.monthlyMetrics[storeId] ?? [])];
  const index = list.findIndex((m) => m.yearMonth === yearMonth);
  const now = new Date().toISOString();

  let updated: MonthlyMetrics;
  if (index === -1) {
    updated = { storeId, yearMonth, ...patch, updatedAt: now };
    list.push(updated);
  } else {
    updated = { ...list[index], ...patch, storeId, yearMonth, updatedAt: now };
    list[index] = updated;
  }
  list.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
  state.setMonthlyMetrics(storeId, list);
  return updated;
}

export async function getGrowthScore(storeId: string, yearMonth: string): Promise<GrowthScore | null> {
  ensureInitialized();
  const store = await getStore(storeId);
  if (!store) return null;
  const history = await listMonthlyData(storeId);
  if (history.length === 0) return null;
  return calculateGrowthScore(storeId, yearMonth, history, store.staffCount);
}

export async function getLatestGrowthScore(storeId: string): Promise<GrowthScore | null> {
  const history = await listMonthlyData(storeId);
  if (history.length === 0) return null;
  return getGrowthScore(storeId, history[history.length - 1].yearMonth);
}
