import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// fetched_content（直近の取得結果）をapproved_contentへ確定する。これは
// 「この内容を確認した」という記録であり、構造化されたFAQ・求人項目
// （chatbot_knowledge_items）への転記はスタッフが別途手動で行う
// （自動生成はしない。基本設計書の「URL自動取得だけに依存せず、管理画面で
// 確認・承認する」方針に合わせ、承認は常に人の目を通す）。
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

  const { data: source, error: sourceError } = await admin
    .from("chatbot_knowledge_sources")
    .select("fetched_content, fetched_content_hash")
    .eq("id", id)
    .maybeSingle();
  if (sourceError || !source) {
    return NextResponse.json({ error: "取得元が見つかりませんでした" }, { status: 404 });
  }

  const { error } = await admin
    .from("chatbot_knowledge_sources")
    .update({
      approved_content: source.fetched_content,
      approved_content_hash: source.fetched_content_hash,
      approved_at: new Date().toISOString(),
      approved_by: user.email ?? user.id,
      status: "approved",
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
