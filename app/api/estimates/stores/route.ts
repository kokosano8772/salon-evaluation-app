import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 見積もりビルダーの「既存クライアントを選択」ピッカー用。storesは通常RLS経由で
// 直接アクセスできるが、見積もり機能のデータアクセスをAPIルート経由に統一するため、
// あえてここでも一度APIを挟む（diagnosis-vaultのstoreOptions取得と同じ考え方）。
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("stores").select("id, name").order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ stores: data ?? [] });
}
