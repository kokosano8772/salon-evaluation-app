import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./database.types";

// Server Component / Route Handler から使うSupabaseクライアント。
// こちらもanon keyのみ。RLSにより認証済み(authenticated)ロールでない限り
// stores/monthly_metrics/diagnosis_resultsへのアクセスはDB側で拒否される。
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Componentから呼ばれた場合はここで例外になるが、
            // middlewareがセッションのリフレッシュを担うため無視してよい。
          }
        },
      },
    }
  );
}
