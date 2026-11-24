import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapUnansweredQuestion } from "@/lib/chatbot/mappers";

export async function GET(_request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { storeId } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chatbot_unanswered_questions")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ questions: (data ?? []).map(mapUnansweredQuestion) });
}
