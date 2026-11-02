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

  let templateQuery = admin.from("estimate_templates").select("*").order("sort_order");
  if (!includeInactive) templateQuery = templateQuery.eq("is_active", true);
  const { data: templates, error: templatesError } = await templateQuery;
  if (templatesError) return NextResponse.json({ error: templatesError.message }, { status: 500 });

  const templateIds = (templates ?? []).map((t) => t.id);
  const { data: templateItems } = await admin
    .from("estimate_template_items")
    .select("*")
    .in("template_id", templateIds.length > 0 ? templateIds : [""])
    .order("sort_order");

  const catalogItemIds = Array.from(new Set((templateItems ?? []).map((ti) => ti.catalog_item_id)));
  const { data: catalogItems } = await admin
    .from("estimate_catalog_items")
    .select("*")
    .in("id", catalogItemIds.length > 0 ? catalogItemIds : [""]);
  const catalogItemById = new Map((catalogItems ?? []).map((c) => [c.id, c]));

  const result = (templates ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    sortOrder: t.sort_order,
    isActive: t.is_active,
    items: (templateItems ?? [])
      .filter((ti) => ti.template_id === t.id)
      .map((ti) => {
        const catalogItem = catalogItemById.get(ti.catalog_item_id);
        return {
          catalogItemId: ti.catalog_item_id,
          defaultQuantity: ti.default_quantity,
          sortOrder: ti.sort_order,
          name: catalogItem?.name ?? "（削除済みの項目）",
          category: catalogItem?.category ?? "",
          unit: catalogItem?.unit ?? "",
          unitPrice: catalogItem?.unit_price ?? 0,
          catalogItemIsActive: catalogItem?.is_active ?? false,
        };
      }),
  }));

  return NextResponse.json({ templates: result });
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
    name?: string;
    description?: string;
    items?: { catalogItemId: string; defaultQuantity?: number }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  if (typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "プリセット名が必要です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: template, error: templateError } = await admin
    .from("estimate_templates")
    .insert({ name: body.name.trim(), description: body.description ?? "", created_by: user.email ?? user.id })
    .select("id")
    .single();
  if (templateError) return NextResponse.json({ error: templateError.message }, { status: 500 });

  const items = body.items ?? [];
  if (items.length > 0) {
    const { error: itemsError } = await admin.from("estimate_template_items").insert(
      items.map((it, i) => ({
        template_id: template.id,
        catalog_item_id: it.catalogItemId,
        default_quantity: it.defaultQuantity ?? 1,
        sort_order: i,
      }))
    );
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ id: template.id });
}
