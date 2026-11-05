import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapKnowledgeItem } from "@/lib/chatbot/mappers";
import { KnowledgeItemType } from "@/components/chatbot/types";

const ITEM_TYPES: KnowledgeItemType[] = [
  "salary",
  "holiday",
  "location",
  "hours",
  "benefits",
  "requirements",
  "training",
  "selection_flow",
  "faq",
  "other",
];

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
    .from("chatbot_knowledge_items")
    .select("*")
    .eq("store_id", storeId)
    .order("item_type")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: (data ?? []).map(mapKnowledgeItem) });
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
  let body: {
    sourceId?: string | null;
    itemType?: string;
    category?: string;
    title?: string;
    body?: string;
    sortOrder?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (typeof body.itemType !== "string" || !ITEM_TYPES.includes(body.itemType as KnowledgeItemType)) {
    return NextResponse.json({ error: "項目種別が不正です" }, { status: 400 });
  }
  if (typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "タイトルが必要です" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chatbot_knowledge_items")
    .insert({
      store_id: storeId,
      source_id: body.sourceId ?? null,
      item_type: body.itemType as KnowledgeItemType,
      category: body.category?.trim() ?? "",
      title: body.title.trim(),
      body: body.body ?? "",
      sort_order: Number.isFinite(body.sortOrder) ? body.sortOrder! : 0,
      created_by: user.email ?? user.id,
      updated_by: user.email ?? user.id,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id });
}
