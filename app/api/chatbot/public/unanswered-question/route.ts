import { NextResponse } from "next/server";
import { verifyBridgeKey, resolvePublishedBot } from "@/lib/chatbot/bridge-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { classifyUnansweredQuestion } from "@/lib/ai/classifyUnansweredQuestion";

const MAX_QUESTION_LENGTH = 1000;

// AIが「情報がございません」と答えた質問を受け取り、Geminiで分類した上で
// 求人・採用に関係があり不適切でないものだけをchatbot_unanswered_questionsに記録する。
// 生の質問文（body.question）はこのリクエストの処理中のみ使い、DBには一切書き込まない
// （chatbot_unanswered_questionsのテーブルコメント参照）。
export async function POST(request: Request) {
  const authError = verifyBridgeKey(request);
  if (authError) return authError;

  let body: { bot?: string; question?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  if (typeof body.bot !== "string" || !body.bot) {
    return NextResponse.json({ error: "bot is required" }, { status: 400 });
  }
  if (typeof body.question !== "string" || !body.question.trim()) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const bot = await resolvePublishedBot(body.bot);
  if (!bot) return NextResponse.json({ error: "not found" }, { status: 404 });

  const classification = await classifyUnansweredQuestion(body.question.trim().slice(0, MAX_QUESTION_LENGTH));
  if (!classification.shouldLog || !classification.summary) {
    return NextResponse.json({ ok: true, logged: false });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("chatbot_unanswered_questions").insert({
    store_id: bot.store_id,
    category: classification.category,
    summary: classification.summary,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, logged: true });
}
