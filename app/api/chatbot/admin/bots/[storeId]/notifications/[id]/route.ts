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
  let body: { email?: string; name?: string; isPrimary?: boolean; isActive?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const update: { email?: string; name?: string; is_primary?: boolean; is_active?: boolean } = {};
  if (body.email !== undefined) {
    if (!body.email.trim().includes("@")) return NextResponse.json({ error: "有効なメールアドレスを入力してください" }, { status: 400 });
    update.email = body.email.trim();
  }
  if (body.name !== undefined) update.name = body.name.trim();
  if (body.isPrimary !== undefined) update.is_primary = body.isPrimary;
  if (body.isActive !== undefined) update.is_active = body.isActive;

  const admin = createAdminClient();
  const { error } = await admin.from("chatbot_notification_contacts").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ storeId: string; id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("chatbot_notification_contacts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
