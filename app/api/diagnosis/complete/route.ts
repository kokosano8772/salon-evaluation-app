import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";

// 詳細診断(/diagnosis)完了時に呼ばれる。/diagnosis自体は固定パスコードのみの
// ゲートで実質未認証のため、ここではSupabase的にも常にanonとして扱う。
// テーブルへの直接アクセス権は無く、SECURITY DEFINER関数 link_diagnosis_to_store
// 経由でのみ書き込む（詳細は supabase/migrations/0001_init.sql 参照）。
//
// ここで行うのは「入力バリデーション」と「診断ページ以外からの直叩きを難しくする」
// ための最低限のチョークポイント。堅牢なIPレート制限などは今回のスコープ外。

const RANKS = ["S", "A", "B", "C", "D"];

interface CompleteRequestBody {
  salonName?: unknown;
  salonPhone?: unknown;
  totalScore?: unknown;
  rank?: unknown;
  categoryScores?: unknown;
  answers?: unknown;
  completedAt?: unknown;
}

function isValidBody(body: CompleteRequestBody): body is {
  salonName: string;
  salonPhone: string;
  totalScore: number;
  rank: string;
  categoryScores: unknown;
  answers: unknown;
  completedAt: string;
} {
  if (typeof body.salonName !== "string" || body.salonName.trim().length === 0 || body.salonName.length > 200) {
    return false;
  }
  const digitsOnlyPhone = typeof body.salonPhone === "string" ? body.salonPhone.replace(/\D/g, "") : "";
  if (digitsOnlyPhone.length < 8 || digitsOnlyPhone.length > 15) {
    return false;
  }
  if (typeof body.totalScore !== "number" || body.totalScore < 0 || body.totalScore > 100) {
    return false;
  }
  if (typeof body.rank !== "string" || !RANKS.includes(body.rank)) {
    return false;
  }
  if (!Array.isArray(body.categoryScores)) {
    return false;
  }
  if (typeof body.answers !== "object" || body.answers === null) {
    return false;
  }
  if (typeof body.completedAt !== "string" || Number.isNaN(Date.parse(body.completedAt))) {
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  let body: CompleteRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.rpc("link_diagnosis_to_store", {
    p_salon_name: body.salonName,
    p_salon_phone: body.salonPhone,
    p_total_score: body.totalScore,
    p_rank: body.rank,
    p_category_scores: body.categoryScores,
    p_answers: body.answers,
    p_completed_at: body.completedAt,
  });

  if (error) {
    return NextResponse.json({ error: "unable to process request" }, { status: 400 });
  }

  return NextResponse.json({ diagnosisResultId: data });
}
