import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Database } from "@/lib/supabase/database.types";

type CatalogItemRow = Database["public"]["Tables"]["estimate_catalog_items"]["Row"];

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
    category?: string;
    name?: string;
    description?: string;
    unit?: string;
    unitPrice?: number;
    sortOrder?: number;
    isActive?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const update: Partial<CatalogItemRow> = {};
  if (body.category !== undefined) update.category = body.category.trim();
  if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: "項目名が必要です" }, { status: 400 });
    update.name = body.name.trim();
  }
  if (body.description !== undefined) update.description = body.description;
  if (body.unit !== undefined) update.unit = body.unit.trim() || "式";
  if (body.unitPrice !== undefined) update.unit_price = Math.round(body.unitPrice);
  if (body.sortOrder !== undefined) update.sort_order = body.sortOrder;
  if (body.isActive !== undefined) update.is_active = body.isActive;

  const admin = createAdminClient();
  const { error } = await admin.from("estimate_catalog_items").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// 物理削除はしない。estimate_template_items / estimate_line_itemsが参照している
// 可能性があり、物理削除するとプリセットが壊れる（0026_estimates_schema.sqlの
// コメント参照）。非アクティブ化のみを行い、ビルダー・プリセット編集画面からは
// 見えなくする。
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
  const { error } = await admin.from("estimate_catalog_items").update({ is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
