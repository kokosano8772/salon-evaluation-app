"use client";

import { useCallback, useEffect, useState } from "react";
import * as repo from "./repository";
import { GrowthScore, LinkedDiagnosisResult, MonthlyMetrics, Store } from "./types";

// コンポーネントから repository.ts を扱いやすくする薄いフック群。
// useGrowthDbStore を直接importしないための唯一の窓口。

export function useStores(params: repo.GetStoresParams) {
  const paramsKey = JSON.stringify(params);
  const [items, setItems] = useState<Store[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    repo.getStores(JSON.parse(paramsKey)).then(({ items, total }) => {
      setItems(items);
      setTotal(total);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, total, loading, refresh };
}

export function useStore(storeId: string | undefined) {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!storeId) {
      setStore(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    repo.getStore(storeId).then((s) => {
      setStore(s);
      setLoading(false);
    });
  }, [storeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { store, loading, refresh };
}

export function useMonthlyMetrics(storeId: string | undefined, range?: repo.MonthlyRange) {
  const rangeKey = JSON.stringify(range ?? {});
  const [data, setData] = useState<MonthlyMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!storeId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    repo.listMonthlyData(storeId, JSON.parse(rangeKey)).then((list) => {
      setData(list);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, rangeKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}

export function useLatestGrowthScore(storeId: string | undefined) {
  const [score, setScore] = useState<GrowthScore | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!storeId) {
      setScore(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    repo.getLatestGrowthScore(storeId).then((s) => {
      setScore(s);
      setLoading(false);
    });
  }, [storeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { score, loading, refresh };
}

export function useDiagnosisResults(storeId: string | undefined) {
  const [items, setItems] = useState<LinkedDiagnosisResult[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!storeId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    repo.getDiagnosisResultsForStore(storeId).then((list) => {
      setItems(list);
      setLoading(false);
    });
  }, [storeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, refresh };
}

export function useGrowthScore(storeId: string | undefined, yearMonth: string | undefined) {
  const [score, setScore] = useState<GrowthScore | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!storeId || !yearMonth) {
      setScore(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    repo.getGrowthScore(storeId, yearMonth).then((s) => {
      setScore(s);
      setLoading(false);
    });
  }, [storeId, yearMonth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { score, loading, refresh };
}
