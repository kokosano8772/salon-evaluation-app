"use client";

import { useCallback, useEffect, useState } from "react";
import * as repo from "./competitor-repository";

// hooks.ts と同じ薄いラッパー方式。コンポーネントから competitor-repository.ts を
// 扱いやすくする窓口。

export function useCompetitorSessions(storeId: string | undefined) {
  const [items, setItems] = useState<repo.CompetitorSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!storeId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    repo.listCompetitorSessions(storeId).then((list) => {
      setItems(list);
      setLoading(false);
    });
  }, [storeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, refresh };
}

export function useCompetitorSession(sessionId: string | undefined) {
  const [session, setSession] = useState<repo.CompetitorSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!sessionId) {
      setSession(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    repo.getCompetitorSession(sessionId).then((s) => {
      setSession(s);
      setLoading(false);
    });
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { session, loading, refresh };
}
