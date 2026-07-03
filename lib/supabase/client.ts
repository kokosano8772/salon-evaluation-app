import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./database.types";

// ブラウザ（クライアントコンポーネント）から使うSupabaseクライアント。
// anon keyのみを使用し、service_role keyはアプリのどこでも使用しない。
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
