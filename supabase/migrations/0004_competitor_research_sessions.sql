-- 店舗ごとの競合分析（集客/求人リサーチ）セッションを保存するテーブル。
-- 他の成長データベース系テーブル（stores, monthly_metrics）と同じRLS方針：
-- anonへの権限は一切なし、authenticated（ログイン済みスタッフ）のみ全操作可。
-- Supabaseダッシュボードの SQL Editor に貼り付けて実行してください。

create table if not exists competitor_research_sessions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  region text not null,
  mode text not null check (mode in ('attraction', 'recruitment', 'both')),
  -- 一覧表示を軽くするための非正規化カラム（salons/cell_dataは一覧取得時には使わない）
  competitor_count int not null default 0,
  salons jsonb not null default '[]',
  cell_data jsonb not null default '{}',
  ai_result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists competitor_research_sessions_store_id_idx
  on competitor_research_sessions (store_id);

create or replace function update_competitor_research_sessions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists competitor_research_sessions_updated_at on competitor_research_sessions;
create trigger competitor_research_sessions_updated_at
  before update on competitor_research_sessions
  for each row execute function update_competitor_research_sessions_updated_at();

alter table competitor_research_sessions enable row level security;

revoke all on competitor_research_sessions from anon, authenticated, public;
grant select, insert, update, delete on competitor_research_sessions to authenticated;

create policy "authenticated_full_access_competitor_research_sessions"
  on competitor_research_sessions
  for all
  to authenticated
  using (true)
  with check (true);
