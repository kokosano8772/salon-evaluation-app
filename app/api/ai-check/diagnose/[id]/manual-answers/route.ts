import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DiagnosisItem } from "@/lib/ai-check/types";
import { aggregateCategoryScores, calculateTotalScore, mergeManualAnswers } from "@/lib/ai-check/scoring";
import { calculateAiCheckRank } from "@/lib/ai-check/types";

export const runtime = "nodejs";

// 自動診断でfail/unknownだった項目について、本人がYes/Noを回答する機能（設計書
// Phase 2の「手動診断」）。既にpassの項目は上書きしない（mergeManualAnswers側で保証）。
// Geminiは呼ばない（決定的な再計算のみ）。
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const answers: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (typeof value === "boolean") answers[key] = value;
  }

  const admin = createAdminClient();
  const { data: existing, error: fetchError } = await admin
    .from("ai_check_diagnoses")
    .select("diagnosis_items, manual_answers")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "診断結果が見つかりませんでした" }, { status: 404 });

  const items = mergeManualAnswers(existing.diagnosis_items as DiagnosisItem[], answers);
  const categoryScores = aggregateCategoryScores(items);
  const totalScore = calculateTotalScore(categoryScores);
  const rank = calculateAiCheckRank(totalScore);
  const mergedAnswers = { ...(existing.manual_answers as Record<string, boolean>), ...answers };

  const { data, error: updateError } = await admin
    .from("ai_check_diagnoses")
    .update({
      diagnosis_items: items,
      category_scores: categoryScores,
      total_score: totalScore,
      rank,
      manual_answers: mergedAnswers,
    })
    .eq("id", id)
    .select(
      "id, url, total_score, rank, summary, target, strengths, weaknesses, missing_information, recommendations, category_scores, diagnosis_items, manual_answers, crawl_warning, created_at"
    )
    .single();

  if (updateError || !data) {
    return NextResponse.json({ error: updateError?.message ?? "更新に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ diagnosis: data });
}
