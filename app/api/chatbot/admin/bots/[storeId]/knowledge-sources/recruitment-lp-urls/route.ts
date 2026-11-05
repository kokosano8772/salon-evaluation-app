import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// stores.recruitment_lp_urls（既存・読み取り専用）から取り込み候補を一覧表示するための
// 補助API。この列自体は広告レポートAI分析でも参照されているため、チャットボット機能側は
// 一切書き込まず、取り込み時にchatbot_knowledge_sourcesへ値をコピーするだけにとどめる。
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
  const { data, error } = await admin.from("stores").select("recruitment_lp_urls").eq("id", storeId).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "店舗が見つかりませんでした" }, { status: 404 });

  const urls = Array.isArray(data.recruitment_lp_urls) ? (data.recruitment_lp_urls as { id: string; name: string; url: string }[]) : [];
  return NextResponse.json({ urls });
}
