import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// ai_check_diagnosesはservice_role専用（RLSでanon/authenticatedを一切許可していない）
// ため、結果画面への表示はこのAPI経由で行う。client_ip（レートリミット用、非公開情報）は
// 選択カラムから意図的に除外し、レスポンスに含めない。
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ai_check_diagnoses")
    .select(
      "id, url, total_score, rank, summary, target, strengths, weaknesses, missing_information, recommendations, category_scores, diagnosis_items, crawl_warning, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "診断結果が見つかりませんでした" }, { status: 404 });

  return NextResponse.json({ diagnosis: data });
}
