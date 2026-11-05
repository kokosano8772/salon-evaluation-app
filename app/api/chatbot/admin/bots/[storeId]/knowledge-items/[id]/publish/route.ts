import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 下書き（item_type/category/title/body/sort_order）をpublished_snapshotへ
// コピーし、is_published=trueにする。ブリッジAPIはis_published=trueの行の
// published_snapshotのみを返すため、ここを通さない限り編集中の内容は
// 公開中のチャットボットに反映されない。
export async function POST(_request: Request, { params }: { params: Promise<{ storeId: string; id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: current, error: currentError } = await admin
    .from("chatbot_knowledge_items")
    .select("item_type, category, title, body, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (currentError || !current) {
    return NextResponse.json({ error: "項目が見つかりませんでした" }, { status: 404 });
  }

  const { error } = await admin
    .from("chatbot_knowledge_items")
    .update({
      is_published: true,
      published_snapshot: {
        item_type: current.item_type,
        category: current.category,
        title: current.title,
        body: current.body,
        sort_order: current.sort_order,
      },
      published_at: new Date().toISOString(),
      published_by: user.email ?? user.id,
      updated_by: user.email ?? user.id,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
