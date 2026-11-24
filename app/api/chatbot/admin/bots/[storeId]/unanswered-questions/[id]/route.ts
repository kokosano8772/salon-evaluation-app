import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ storeId: string; id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { status?: "added_to_faq" | "dismissed" | "open" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (!body.status || !["open", "added_to_faq", "dismissed"].includes(body.status)) {
    return NextResponse.json({ error: "status が不正です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("chatbot_unanswered_questions")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
