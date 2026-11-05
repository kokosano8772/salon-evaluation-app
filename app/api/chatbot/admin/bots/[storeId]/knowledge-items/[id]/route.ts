import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Database } from "@/lib/supabase/database.types";

type KnowledgeItemUpdate = Database["public"]["Tables"]["chatbot_knowledge_items"]["Update"];

export async function PATCH(request: Request, { params }: { params: Promise<{ storeId: string; id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: {
    category?: string;
    title?: string;
    body?: string;
    sortOrder?: number;
    isPublished?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  // is_publishedをtrueにする操作はpublished_snapshotの更新を伴わないため、
  // このエンドポイントでは許可しない（.../publish を経由させることで、必ず
  // 下書きの内容がスナップショットされた状態で公開されることを保証する）。
  if (body.isPublished === true) {
    return NextResponse.json({ error: "公開は専用のAPIから行ってください" }, { status: 400 });
  }

  const update: KnowledgeItemUpdate = { updated_by: user.email ?? user.id };
  if (body.category !== undefined) update.category = body.category.trim();
  if (body.title !== undefined) {
    if (!body.title.trim()) return NextResponse.json({ error: "タイトルが必要です" }, { status: 400 });
    update.title = body.title.trim();
  }
  if (body.body !== undefined) update.body = body.body;
  if (body.sortOrder !== undefined && Number.isFinite(body.sortOrder)) update.sort_order = body.sortOrder;
  if (body.isPublished === false) update.is_published = false;

  const admin = createAdminClient();
  const { error } = await admin.from("chatbot_knowledge_items").update(update).eq("id", id);
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
  const { error } = await admin.from("chatbot_knowledge_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
