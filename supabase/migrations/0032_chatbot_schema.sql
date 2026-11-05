-- 美容室求人チャットボット機能のスキーマ（P1: 成長DB側の管理機能のみ）。
-- 「美容室求人チャットボット_基本設計書_v1.2」を土台に、以下の方針を反映した実装用たたき台。
--
-- 1. 既存の成長データベース（stores等）とは独立したテーブル群にする。stores は
--    「ログインしているスタッフなら誰でも全件読み書きできる」社内共有CRM的なRLS
--    （0001_init.sqlの authenticated_full_access_stores）であり、公開ID・承認状態・
--    下書き/公開の分離といった本機能に必要な概念も無いため、ranking_* / ai_check_*と
--    同じ設計（RLSで全ロールをブロックし、service_role経由のAPIルートのみで
--    アクセスする）を踏襲する。テーブル名は chatbot_ プレフィックスを付ける。
-- 2. チャットボット本体は別Vercelプロジェクトで稼働させるが、Supabaseの
--    service_roleキーはこのプロジェクトの外には一切渡さない。別Vercel側は
--    このアプリが新設する /api/chatbot/public/* の「ブリッジAPI」（共有シークレット
--    で認証、必要最小限のフィールドだけを返す）経由でのみデータを取得・記録する。
--    そのためこのテーブル群にも匿名公開用のRLSポリシーは一切追加しない。
-- 3. 応募者の氏名・メールアドレス等を保存するテーブル（applications等）は作らない。
--    応募内容は別Vercelプロジェクトがサロン担当者へ直接メール送信するのみとし、
--    自社Supabase・ログには一切残さない。
-- 4. AIチャットの会話内容もMVPでは保存しない。個人情報を含まない日次の
--    利用件数・トークン使用量・推定費用・エラー件数のみを記録する
--    （chatbot_usage_daily / chatbot_error_logs）。
-- 5. FAQ・プロンプト・選択式フローは下書き(draft)と公開(published)を分離する。
--    別Vercelプロジェクトのブリッジ経由readは常にpublished側のみを返し、
--    編集中の下書きが公開中のチャットボットに反映されないようにする。
--    （ドメイン許可・レート制限しきい値・料金上限などの運用設定は即時反映でよいため
--    下書き/公開は分けない）

create table if not exists chatbot_bot_configs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  -- 埋め込み（iframe src等）で公開するランダムID。内部store_idを直接露出しない。
  public_bot_id text not null default encode(gen_random_bytes(16), 'hex'),
  -- draft: 設定中で未公開 / published: 公開中（ブリッジAPIが応答する） / archived: 停止
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  mode text not null default 'choice' check (mode in ('choice', 'ai', 'hybrid')),
  -- 埋め込みを許可するドメイン一覧。別Vercelプロジェクト側でiframeのCSP
  -- frame-ancestorsの動的生成、およびOrigin/Refererの補助検証に使う。
  allowed_domains jsonb not null default '[]',
  -- ウィジェットの表示設定（色・位置・開閉ボタン文言等）。別Vercel側の描画にのみ使う。
  theme jsonb not null default '{}',
  -- 不正利用対策のしきい値。実際のカウント・遮断は別Vercelプロジェクト側の
  -- 高速ストア（Vercel KV/Upstash等）で行う。ここはあくまで管理画面で
  -- 調整する「設定値」であり、カウンタの実体はSupabaseに置かない
  -- （AI利用料金の集計=chatbot_usage_dailyとは目的も整合性要件も異なるため分離する）。
  rate_limit_per_minute int not null default 20,
  rate_limit_per_day int not null default 500,
  -- AI利用料金の月間上限（任意）。chatbot_usage_dailyの当月合計と比較して
  -- 管理画面に警告を出す／別Vercel側のAI呼び出し前チェックに使う想定。
  ai_monthly_token_limit int,
  ai_monthly_cost_limit_usd numeric,
  -- サロン別のAIシステムプロンプト。下書き/公開を分離し、ブリッジAPIは
  -- published_system_promptのみを返す。
  draft_system_prompt text not null default '',
  published_system_prompt text not null default '',
  prompt_published_at timestamptz,
  prompt_published_by text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id),
  unique (public_bot_id)
);

create table if not exists chatbot_notification_contacts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  email text not null,
  name text not null default '',
  is_primary boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chatbot_notification_contacts_store_id_idx
  on chatbot_notification_contacts(store_id);

create table if not exists chatbot_knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  -- recruitment_lp: stores.recruitment_lp_urls からの取り込み（読み取り専用。
  -- stores側の列は書き換えない） / manual_url: 個別に登録したURL / manual_text: 手入力
  source_type text not null check (source_type in ('recruitment_lp', 'manual_url', 'manual_text')),
  url text not null default '',
  -- 直近の取得結果（プレーンテキスト抽出）。取得しただけではまだ公開情報には
  -- 反映されない。スタッフが内容を確認し、承認して初めて approved_content に写る。
  fetched_content text not null default '',
  fetched_content_hash text not null default '',
  fetched_at timestamptz,
  -- 承認済みのスナップショット。chatbot_knowledge_items作成時の参照元として使う。
  approved_content text not null default '',
  approved_content_hash text not null default '',
  approved_at timestamptz,
  approved_by text,
  -- pending: 未取得 / fetched: 取得済み未承認 / approved: 承認済み（最新を反映）/
  -- rejected: 承認見送り / stale: 承認後に再取得した内容が承認済みと異なる（再確認待ち）
  status text not null default 'pending' check (status in ('pending', 'fetched', 'approved', 'rejected', 'stale')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chatbot_knowledge_sources_store_id_idx
  on chatbot_knowledge_sources(store_id);

create table if not exists chatbot_knowledge_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  source_id uuid references chatbot_knowledge_sources(id) on delete set null,
  item_type text not null check (item_type in (
    'salary', 'holiday', 'location', 'hours', 'benefits',
    'requirements', 'training', 'selection_flow', 'faq', 'other'
  )),
  category text not null default '',
  title text not null default '',
  body text not null default '',
  metadata jsonb not null default '{}',
  sort_order int not null default 0,
  -- 下書き（上記の編集可能列）と公開版を分離する。公開版は変更の都度
  -- published_snapshotへスナップショットし、ブリッジAPIはis_published=trueの
  -- 行についてpublished_snapshotのみを返す（draft側の編集は即座には反映しない）。
  is_published boolean not null default false,
  published_snapshot jsonb,
  published_at timestamptz,
  published_by text,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chatbot_knowledge_items_store_id_idx
  on chatbot_knowledge_items(store_id);
create index if not exists chatbot_knowledge_items_store_published_idx
  on chatbot_knowledge_items(store_id, is_published);

create table if not exists chatbot_flow_versions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  version int not null,
  draft_json jsonb not null default '{}',
  published_json jsonb,
  published_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  unique (store_id, version)
);

create index if not exists chatbot_flow_versions_store_id_idx
  on chatbot_flow_versions(store_id);

-- 個人情報を含まない匿名集計のみ。会話内容・応募内容は一切保存しない。
create table if not exists chatbot_usage_daily (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  date date not null,
  chat_message_count int not null default 0,
  ai_response_count int not null default 0,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  estimated_cost_usd numeric not null default 0,
  application_success_count int not null default 0,
  application_failure_count int not null default 0,
  widget_load_count int not null default 0,
  updated_at timestamptz not null default now(),
  unique (store_id, date)
);

create index if not exists chatbot_usage_daily_store_id_idx
  on chatbot_usage_daily(store_id);

-- 個人情報を含まない技術的エラーのみ（応募者氏名・チャット本文・リクエストボディは
-- 書き込まない運用とする。message列には固定の技術メッセージ/エラーコードのみを入れること）。
create table if not exists chatbot_error_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete set null,
  error_code text not null,
  error_source text not null check (error_source in ('ai', 'email', 'fetch', 'flow', 'rate_limit', 'other')),
  message text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists chatbot_error_logs_store_id_created_at_idx
  on chatbot_error_logs(store_id, created_at);

-- chatbot_usage_dailyへの加算をアトミックに行うための関数。別Vercelプロジェクトからの
-- 同時アクセス（複数リクエストが同時にusage-eventブリッジAPIを呼ぶ）があっても、
-- アプリ側で「読んで+1して書き戻す」方式だと更新が失われ得るため、
-- INSERT ... ON CONFLICT DO UPDATE の1文でDB側に加算させる
-- （Postgresの行ロックにより、この1文自体は並行呼び出しに対して安全）。
create or replace function public.chatbot_increment_usage(
  p_store_id uuid,
  p_date date,
  p_chat_message_count int default 0,
  p_ai_response_count int default 0,
  p_input_tokens int default 0,
  p_output_tokens int default 0,
  p_estimated_cost_usd numeric default 0,
  p_application_success_count int default 0,
  p_application_failure_count int default 0,
  p_widget_load_count int default 0
) returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into chatbot_usage_daily (
    store_id, date, chat_message_count, ai_response_count, input_tokens, output_tokens,
    estimated_cost_usd, application_success_count, application_failure_count, widget_load_count
  ) values (
    p_store_id, p_date, p_chat_message_count, p_ai_response_count, p_input_tokens, p_output_tokens,
    p_estimated_cost_usd, p_application_success_count, p_application_failure_count, p_widget_load_count
  )
  on conflict (store_id, date) do update set
    chat_message_count = chatbot_usage_daily.chat_message_count + excluded.chat_message_count,
    ai_response_count = chatbot_usage_daily.ai_response_count + excluded.ai_response_count,
    input_tokens = chatbot_usage_daily.input_tokens + excluded.input_tokens,
    output_tokens = chatbot_usage_daily.output_tokens + excluded.output_tokens,
    estimated_cost_usd = chatbot_usage_daily.estimated_cost_usd + excluded.estimated_cost_usd,
    application_success_count = chatbot_usage_daily.application_success_count + excluded.application_success_count,
    application_failure_count = chatbot_usage_daily.application_failure_count + excluded.application_failure_count,
    widget_load_count = chatbot_usage_daily.widget_load_count + excluded.widget_load_count,
    updated_at = now();
$$;

revoke all on function public.chatbot_increment_usage from public;
grant execute on function public.chatbot_increment_usage to service_role;

alter table chatbot_bot_configs enable row level security;
alter table chatbot_notification_contacts enable row level security;
alter table chatbot_knowledge_sources enable row level security;
alter table chatbot_knowledge_items enable row level security;
alter table chatbot_flow_versions enable row level security;
alter table chatbot_usage_daily enable row level security;
alter table chatbot_error_logs enable row level security;
-- ポリシーを一切作らない（ranking_* / ai_check_diagnosesと同じ方針）。anon/authenticated
-- のどちらにも直接アクセスさせず、service_role（lib/supabase/admin.ts）経由の
-- APIルートのみで読み書きする。管理画面からのログイン確認はAPIルート側で
-- auth.getUser()により行い、別Vercelプロジェクトからのブリッジ経由アクセスは
-- 共有シークレット（CHATBOT_BRIDGE_API_KEY）による検証をAPIルート側で行う。
