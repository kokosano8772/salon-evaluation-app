"use client";

import { useCallback, useEffect, useState } from "react";
import * as repo from "./ad-report-repository";
import { AdReport } from "./ad-report-types";

// hooks.ts / competitor-hooks.ts と同じ薄いラッパー方式。

export function useAdReports(storeId: string | undefined, yearMonth?: string) {
  const [items, setItems] = useState<AdReport[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!storeId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    repo.listAdReports(storeId, yearMonth).then((list) => {
      setItems(list);
      setLoading(false);
    });
  }, [storeId, yearMonth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, refresh };
}
