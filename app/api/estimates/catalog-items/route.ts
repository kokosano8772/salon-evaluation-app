import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const includeInactive = new URL(request.url).searchParams.get("includeInactive") === "1";
  const admin = createAdminClient();

  let query = admin.from("estimate_catalog_items").select("*").order("category").order("sort_order");
  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    unit: row.unit,
    unitPrice: row.unit_price,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    category?: string;
    name?: string;
    description?: string;
    unit?: string;
    unitPrice?: number;
    sortOrder?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "項目名が必要です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("estimate_catalog_items")
    .insert({
      category: body.category?.trim() ?? "",
      name: body.name.trim(),
      description: body.description ?? "",
      unit: body.unit?.trim() || "式",
      unit_price: Number.isFinite(body.unitPrice) ? Math.round(body.unitPrice!) : 0,
      sort_order: Number.isFinite(body.sortOrder) ? body.sortOrder! : 0,
      created_by: user.email ?? user.id,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id });
}
