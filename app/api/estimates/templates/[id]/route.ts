import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Database } from "@/lib/supabase/database.types";

type TemplateRow = Database["public"]["Tables"]["estimate_templates"]["Row"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: {
    name?: string;
    description?: string;
    isActive?: boolean;
    items?: { catalogItemId: string; defaultQuantity?: number }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();

  const update: Partial<TemplateRow> = {};
  if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: "プリセット名が必要です" }, { status: 400 });
    update.name = body.name.trim();
  }
  if (body.description !== undefined) update.description = body.description;
  if (body.isActive !== undefined) update.is_active = body.isActive;

  if (Object.keys(update).length > 0) {
    const { error } = await admin.from("estimate_templates").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // itemsが渡された場合は全入れ替えする。supabase-jsにはトランザクションが無いため、
  // 削除→再insertの間に他の操作が割り込む可能性はあるが、この機能は社内の少人数利用
  // （同時編集の起きにくい管理画面）のため許容する。
  if (body.items) {
    const { error: deleteError } = await admin.from("estimate_template_items").delete().eq("template_id", id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    if (body.items.length > 0) {
      const { error: insertError } = await admin.from("estimate_template_items").insert(
        body.items.map((it, i) => ({
          template_id: id,
          catalog_item_id: it.catalogItemId,
          default_quantity: it.defaultQuantity ?? 1,
          sort_order: i,
        }))
      );
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("estimate_templates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
