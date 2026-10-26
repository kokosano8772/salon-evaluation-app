import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUrlForMatch } from "@/lib/growth-db/url-match";

interface NamedUrlRow {
  id: string;
  name: string;
  url: string;
}

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

// ダッシュボード内「診断結果の保管庫」用。ai_check_diagnoses（service_role限定）と
// diagnosis_results（stores経由で間接的にリンク済み）を1つの時系列リストにまとめて返す。
// /dashboard配下と同じくSupabase Authでログインしたスタッフのみ呼び出せる。
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const [storesRes, aiCheckRes, diagnosisRes] = await Promise.all([
    admin.from("stores").select("id, name, homepage_urls"),
    admin
      .from("ai_check_diagnoses")
      .select("id, url, salon_name, total_score, score_max, rank, tier, created_at"),
    admin
      .from("diagnosis_results")
      .select("id, store_id, salon_name, total_score, rank, completed_at"),
  ]);

  if (storesRes.error) return NextResponse.json({ error: storesRes.error.message }, { status: 500 });
  if (aiCheckRes.error) return NextResponse.json({ error: aiCheckRes.error.message }, { status: 500 });
  if (diagnosisRes.error) return NextResponse.json({ error: diagnosisRes.error.message }, { status: 500 });

  const stores = storesRes.data ?? [];
  const storesById = new Map(stores.map((s) => [s.id, s]));

  // 店舗ごとのhomepage_urlsを正規化した候補リストにしておき、AIチェック側のURLと突き合わせる。
  const normalizedStoreUrls = stores.map((s) => ({
    store: s,
    normalized: ((s.homepage_urls as NamedUrlRow[] | null) ?? [])
      .map((u) => normalizeUrlForMatch(u.url))
      .filter((n): n is string => n !== null),
  }));

  const aiCheckItems: VaultItem[] = (aiCheckRes.data ?? []).map((row) => {
    const normalizedUrl = normalizeUrlForMatch(row.url);
    const matched = normalizedUrl
      ? normalizedStoreUrls.find((s) => s.normalized.includes(normalizedUrl))
      : undefined;
    return {
      kind: "ai_check",
      id: row.id,
      title: row.salon_name || row.url,
      score: row.total_score,
      scoreMax: row.score_max,
      rank: row.rank,
      tier: row.tier,
      occurredAt: row.created_at,
      matchedStore: matched ? { id: matched.store.id, name: matched.store.name } : null,
      href: `/ai-check/${row.id}`,
    };
  });

  // store_idが無い（店舗が削除された等の）行は、現行UIでは参照先ページが無いため除外する。
  const valueDiagnosisItems: VaultItem[] = (diagnosisRes.data ?? [])
    .filter((row): row is typeof row & { store_id: string } => row.store_id !== null)
    .map((row) => {
      const store = storesById.get(row.store_id);
      return {
        kind: "value_diagnosis",
        id: row.id,
        title: row.salon_name,
        score: row.total_score,
        scoreMax: 100,
        rank: row.rank,
        tier: null,
        occurredAt: row.completed_at,
        matchedStore: store ? { id: store.id, name: store.name } : null,
        href: `/dashboard/stores/${row.store_id}/diagnosis/${row.id}`,
      };
    });

  const results = [...aiCheckItems, ...valueDiagnosisItems].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  return NextResponse.json({ results });
}
