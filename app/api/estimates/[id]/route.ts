import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveLineItems, LineItemInput } from "@/lib/estimates/resolve-line-items";
import { Database } from "@/lib/supabase/database.types";

type EstimateRow = Database["public"]["Tables"]["estimates"]["Row"];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: estimate, error: estimateError } = await admin.from("estimates").select("*").eq("id", id).maybeSingle();
  if (estimateError || !estimate) {
    return NextResponse.json({ error: "見積もりが見つかりませんでした" }, { status: 404 });
  }

  const { data: store } = estimate.store_id
    ? await admin.from("stores").select("id, name").eq("id", estimate.store_id).maybeSingle()
    : { data: null };

  const { data: lineItems, error: lineItemsError } = await admin
    .from("estimate_line_items")
    .select("*")
    .eq("estimate_id", id)
    .order("sort_order");
  if (lineItemsError) return NextResponse.json({ error: lineItemsError.message }, { status: 500 });

  return NextResponse.json({
    estimate: {
      id: estimate.id,
      storeId: estimate.store_id,
      clientName: estimate.client_name,
      clientContact: estimate.client_contact,
      title: estimate.title,
      status: estimate.status,
      sourceTemplateId: estimate.source_template_id,
      subtotal: estimate.subtotal,
      taxRate: estimate.tax_rate,
      taxAmount: estimate.tax_amount,
      total: estimate.total,
      notes: estimate.notes,
      validUntil: estimate.valid_until,
      createdAt: estimate.created_at,
      updatedAt: estimate.updated_at,
    },
    store: store ?? null,
    lineItems: (lineItems ?? []).map((li) => ({
      id: li.id,
      catalogItemId: li.catalog_item_id,
      category: li.category,
      name: li.name,
      description: li.description,
      unit: li.unit,
      unitPrice: li.unit_price,
      procurementCost: li.procurement_cost,
      discountAmount: li.discount_amount,
      discountLabel: li.discount_label,
      quantity: li.quantity,
      amount: li.amount,
      sortOrder: li.sort_order,
    })),
  });
}

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
    storeId?: string | null;
    clientName?: string;
    clientContact?: string;
    title?: string;
    status?: string;
    notes?: string;
    validUntil?: string | null;
    taxRate?: number;
    lineItems?: LineItemInput[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: current, error: currentError } = await admin.from("estimates").select("*").eq("id", id).maybeSingle();
  if (currentError || !current) {
    return NextResponse.json({ error: "見積もりが見つかりませんでした" }, { status: 404 });
  }

  const update: Partial<EstimateRow> = {};
  if (body.storeId !== undefined) update.store_id = body.storeId;
  if (body.clientName !== undefined) update.client_name = body.clientName;
  if (body.clientContact !== undefined) update.client_contact = body.clientContact;
  if (body.title !== undefined) {
    if (!body.title.trim()) return NextResponse.json({ error: "件名が必要です" }, { status: 400 });
    update.title = body.title.trim();
  }
  if (body.status !== undefined) {
    const allowedStatuses = ["draft", "sent", "accepted", "rejected"] as const;
    if (!(allowedStatuses as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: "ステータスが不正です" }, { status: 400 });
    }
    update.status = body.status as (typeof allowedStatuses)[number];
  }
  if (body.notes !== undefined) update.notes = body.notes;
  if (body.validUntil !== undefined) update.valid_until = body.validUntil;

  const taxRate = Number.isFinite(body.taxRate) ? body.taxRate! : current.tax_rate;

  if (body.lineItems) {
    if (body.lineItems.length === 0) {
      return NextResponse.json({ error: "明細を1件以上追加してください" }, { status: 400 });
    }
    const resolved = await resolveLineItems(admin, body.lineItems);
    if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: 400 });

    const { error: deleteError } = await admin.from("estimate_line_items").delete().eq("estimate_id", id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    const { error: insertError } = await admin
      .from("estimate_line_items")
      .insert(resolved.lineItems.map((li) => ({ ...li, estimate_id: id })));
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    update.subtotal = resolved.subtotal;
    update.tax_rate = taxRate;
    update.tax_amount = Math.round(resolved.subtotal * taxRate);
    update.total = resolved.subtotal + Math.round(resolved.subtotal * taxRate);
  } else if (body.taxRate !== undefined) {
    // 明細はそのまま、税率だけ変わった場合は保存済みのsubtotalから再計算する。
    update.tax_rate = taxRate;
    update.tax_amount = Math.round(current.subtotal * taxRate);
    update.total = current.subtotal + Math.round(current.subtotal * taxRate);
  }

  if (Object.keys(update).length > 0) {
    const { error } = await admin.from("estimates").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
  const { error } = await admin.from("estimates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
