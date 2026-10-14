import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_REVIEW_STATUSES = ["unreviewed", "reviewed_ok", "reviewed_flagged"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const reviewStatus = typeof body.reviewStatus === "string" ? body.reviewStatus : "";
  if (!VALID_REVIEW_STATUSES.includes(reviewStatus)) {
    return NextResponse.json({ error: "reviewStatusが不正です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("ranking_audit_runs")
    .update({ review_status: reviewStatus, reviewed_by: user.email ?? user.id, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
