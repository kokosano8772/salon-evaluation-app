-- チャットボットのAIが「情報がございません」と答えた（＝求人情報・FAQに登録が
-- 無く答えられなかった）質問を、FAQ拡充のヒントとして記録する。
--
-- 0032_chatbot_schema.sqlの方針（会話内容は保存しない）に対する唯一の例外。
-- お客さんが打った質問文そのものは一切保存しない。ブリッジAPI
-- （app/api/chatbot/public/unanswered-question/route.ts）が受け取った生の質問文は
-- Geminiでの分類・要約にのみ使い、レスポンスを返したら破棄する。保存するのは
-- 「①求人・採用に関係があり」「②不適切（アダルト・暴言・嫌がらせ等）でない」と
-- Geminiが判定したものだけで、保存する内容もGeminiが作った短い要約・カテゴリのみ
-- （生の質問文そのものは保存しない）。
create table if not exists chatbot_unanswered_questions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  category text not null default '',
  -- Geminiが作った短い要約（生の質問文そのものではない）。
  summary text not null default '',
  -- open: 未対応 / added_to_faq: 求人情報・FAQへ追加済み / dismissed: 対応不要として却下
  status text not null default 'open' check (status in ('open', 'added_to_faq', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chatbot_unanswered_questions_store_status_idx
  on chatbot_unanswered_questions(store_id, status);

alter table chatbot_unanswered_questions enable row level security;
-- ポリシーを一切作らない（他のchatbot_*テーブルと同じ方針）。service_role経由の
-- APIルートのみで読み書きする。
