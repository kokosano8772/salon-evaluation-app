import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// service_role key（RLSを完全にバイパスするサーバー専用キー）を使うクライアント。
// 他のクライアント（client.ts/server.ts）は意図的にanon keyのみを使い、
// ユーザーセッションとRLSに権限管理を委ねているが、Vercel Cronから叩かれる
// トークン自動更新ジョブにはユーザーセッションが存在しないため、ここだけは例外として
// service_role keyを使用する。api_tokensテーブル以外の操作には使わないこと。
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
