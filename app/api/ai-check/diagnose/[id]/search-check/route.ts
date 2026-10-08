import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGeminiModel } from "@/lib/ai/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

// プロ版の「AI検索実測」はオプトインの追加アクション（確定診断とは別にGeminiを
// 質問数ぶん呼ぶ）。確定診断用のレートリミットとは別に、このエンドポイント専用の
// 上限をかける。
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1時間

export interface SearchCheckResult {
  query: string;
  mentioned: boolean;
  excerpt: string;
}

// AIの自己申告ではなく、実際の回答テキストに店舗名が含まれるかをコード側で
// 決定的に判定する（設計書34章の「点数をAIに任せない」原則を実測機能にも適用）。
function containsSalonName(responseText: string, salonName: string): boolean {
  const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();
  const name = normalize(salonName);
  if (!name) return false;
  return normalize(responseText).includes(name);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (clientIp !== "unknown") {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { count, error: countError } = await admin
      .from("ai_check_diagnoses")
      .select("id", { count: "exact", head: true })
      .eq("client_ip", clientIp)
      .gte("search_check_run_at", since);
    if (!countError && (count ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json({ error: "AI検索実測の回数上限に達しました。しばらく時間をおいて再度お試しください。" }, { status: 429 });
    }
  }

  const { data: diagnosis, error: fetchError } = await admin
    .from("ai_check_diagnoses")
    .select("tier, salon_name, suggested_queries")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!diagnosis) return NextResponse.json({ error: "診断結果が見つかりませんでした" }, { status: 404 });
  if (diagnosis.tier !== "pro") {
    return NextResponse.json({ error: "AI検索実測はプロ診断でのみ利用できます" }, { status: 400 });
  }
  const queries = (diagnosis.suggested_queries as string[] | null) ?? [];
  if (queries.length === 0) {
    return NextResponse.json({ error: "この診断では検索質問を生成できませんでした" }, { status: 400 });
  }

  const model = getGeminiModel({ useGoogleSearch: true });

  const results: SearchCheckResult[] = await Promise.all(
    queries.map(async (query): Promise<SearchCheckResult> => {
      try {
        const result = await model.generateContent(query);
        const text = result.response.text();
        return {
          query,
          mentioned: containsSalonName(text, diagnosis.salon_name),
          excerpt: text.slice(0, 300),
        };
      } catch (error) {
        return {
          query,
          mentioned: false,
          excerpt: error instanceof Error ? `（取得できませんでした: ${error.message}）` : "（取得できませんでした）",
        };
      }
    })
  );

  const { error: updateError } = await admin
    .from("ai_check_diagnoses")
    .update({ search_check_results: results, search_check_run_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ results });
}
