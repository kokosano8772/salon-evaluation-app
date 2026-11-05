import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapNotificationContact } from "@/lib/chatbot/mappers";

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
    .from("chatbot_notification_contacts")
    .select("*")
    .eq("store_id", storeId)
    .order("is_primary", { ascending: false })
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ contacts: (data ?? []).map(mapNotificationContact) });
}

export async function POST(request: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { storeId } = await params;

  let body: { email?: string; name?: string; isPrimary?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (typeof body.email !== "string" || !body.email.trim().includes("@")) {
    return NextResponse.json({ error: "有効なメールアドレスを入力してください" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chatbot_notification_contacts")
    .insert({
      store_id: storeId,
      email: body.email.trim(),
      name: body.name?.trim() ?? "",
      is_primary: body.isPrimary ?? false,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id });
}
