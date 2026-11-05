import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveLineItems, LineItemInput } from "@/lib/estimates/resolve-line-items";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const storeId = params.get("storeId");
  const status = params.get("status");
  const allowedStatuses = ["draft", "sent", "accepted", "rejected"] as const;

  const admin = createAdminClient();
  let query = admin.from("estimates").select("*").order("created_at", { ascending: false });
  if (storeId) query = query.eq("store_id", storeId);
  if (status && (allowedStatuses as readonly string[]).includes(status)) {
    query = query.eq("status", status as (typeof allowedStatuses)[number]);
  }

  const { data: estimates, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const storeIds = Array.from(new Set((estimates ?? []).map((e) => e.store_id).filter((id): id is string => !!id)));
  const { data: stores } = await admin.from("stores").select("id, name").in("id", storeIds.length > 0 ? storeIds : [""]);
  const storeNameById = new Map((stores ?? []).map((s) => [s.id, s.name]));

  const results = (estimates ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    status: e.status,
    clientName: e.store_id ? storeNameById.get(e.store_id) ?? e.client_name : e.client_name,
    storeId: e.store_id,
    total: e.total,
    productionDate: e.production_date,
    createdAt: e.created_at,
  }));

  return NextResponse.json({ estimates: results });
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
    storeId?: string | null;
    clientName?: string;
    clientContact?: string;
    title?: string;
    notes?: string;
    productionDate?: string | null;
    taxRate?: number;
    sourceTemplateId?: string | null;
    lineItems?: LineItemInput[];
    staffName?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  // 件名は手入力欄を廃止し、明細の商品名から自動生成するようになったため、
  // 商品名が1件も入力されていない場合は空文字でも保存できるようにする。
  if (!body.storeId && !body.clientName?.trim()) {
    return NextResponse.json({ error: "既存クライアントの選択、またはクライアント名の入力が必要です" }, { status: 400 });
  }
  if (!body.lineItems || body.lineItems.length === 0) {
    return NextResponse.json({ error: "明細を1件以上追加してください" }, { status: 400 });
  }

  const admin = createAdminClient();
  const resolved = await resolveLineItems(admin, body.lineItems);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: 400 });

  const taxRate = Number.isFinite(body.taxRate) ? body.taxRate! : 0.1;
  const subtotal = resolved.subtotal;
  const taxAmount = Math.round(subtotal * taxRate);
  const total = subtotal + taxAmount;

  const { data: estimate, error: estimateError } = await admin
    .from("estimates")
    .insert({
      store_id: body.storeId ?? null,
      client_name: body.clientName?.trim() ?? "",
      client_contact: body.clientContact ?? "",
      title: body.title?.trim() ?? "",
      source_template_id: body.sourceTemplateId ?? null,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes: body.notes ?? "",
      production_date: body.productionDate ?? null,
      // PDFの「担当：」欄にそのまま表示する名前。フォームで入力が無ければ
      // 従来通りログイン中のメールアドレスを入れる（既存の挙動を維持）。
      created_by: body.staffName?.trim() || user.email || user.id,
    })
    .select("id")
    .single();
  if (estimateError) return NextResponse.json({ error: estimateError.message }, { status: 500 });

  const { error: lineItemsError } = await admin.from("estimate_line_items").insert(
    resolved.lineItems.map((li) => ({ ...li, estimate_id: estimate.id }))
  );
  if (lineItemsError) return NextResponse.json({ error: lineItemsError.message }, { status: 500 });

  return NextResponse.json({ id: estimate.id });
}
