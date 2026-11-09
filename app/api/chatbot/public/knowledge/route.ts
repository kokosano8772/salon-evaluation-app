import { NextResponse } from "next/server";
import { verifyBridgeKey, resolvePublishedBot } from "@/lib/chatbot/bridge-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// AIチャット（別Vercelプロジェクト側）がOpenAI APIに渡すシステムプロンプトと
// 根拠情報を取得する。常にpublished側のみを返すため、管理画面で編集中の
// 下書きが公開中のAI応答に混ざることはない。
export async function GET(request: Request) {
  const authError = verifyBridgeKey(request);
  if (authError) return authError;

  const publicBotId = new URL(request.url).searchParams.get("bot");
  if (!publicBotId) return NextResponse.json({ error: "bot is required" }, { status: 400 });

  const bot = await resolvePublishedBot(publicBotId);
  if (!bot) return NextResponse.json({ error: "not found" }, { status: 404 });

  const admin = createAdminClient();
  const [{ data: items, error: itemsError }, { data: sources, error: sourcesError }] = await Promise.all([
    admin.from("chatbot_knowledge_items").select("published_snapshot").eq("store_id", bot.store_id).eq("is_published", true),
    // 承認済み(approved)の求人HP本文のみAIの根拠情報として渡す。fetched/pending/stale/rejectedは
    // 未承認・下書き情報のため含めない（承認済みのスナップショットはapproved_contentに
    // 保持されており、再取得後に未承認のまま変更されていてもここには影響しない）。
    admin.from("chatbot_knowledge_sources").select("url, approved_content").eq("store_id", bot.store_id).eq("status", "approved"),
  ]);
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  if (sourcesError) return NextResponse.json({ error: sourcesError.message }, { status: 500 });

  return NextResponse.json({
    systemPrompt: bot.published_system_prompt,
    items: (items ?? []).map((i) => i.published_snapshot).filter(Boolean),
    approvedSources: (sources ?? [])
      .filter((s) => s.approved_content)
      .map((s) => ({ url: s.url, content: s.approved_content })),
  });
}
