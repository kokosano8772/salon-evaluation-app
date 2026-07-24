-- 店舗ごとの広告レポート（Google広告・Meta広告）を保存するテーブル。
-- monthly_metricsは変更せず、store_id + year_month + platformで紐付ける新規サイドテーブルにする。
-- 他の成長データベース系テーブルと同じRLS方針：anonへの権限は一切なし、
-- authenticated（ログイン済みスタッフ）のみ全操作可。
-- Supabaseダッシュボードの SQL Editor に貼り付けて実行してください。

create table if not exists ad_reports (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  year_month text not null,
  platform text not null check (platform in ('google', 'meta')),
  account_id text not null default '',
  spend numeric not null default 0,
  impressions int not null default 0,
  clicks int not null default 0,
  ctr numeric not null default 0,
  cpc numeric not null default 0,
  conversions numeric not null default 0,
  cpa numeric not null default 0,
  cvr numeric not null default 0,
  reach int,
  frequency numeric,
  -- キャンペーン別データ（Google Ads/Meta Marketing APIから取得後、共通形式に変換して格納）
  campaigns jsonb not null default '[]',
  -- AI分析結果のキャッシュ（Phase4で使用）
  ai_result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, year_month, platform)
);

create index if not exists ad_reports_store_id_idx
  on ad_reports (store_id);

create or replace function update_ad_reports_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ad_reports_updated_at on ad_reports;
create trigger ad_reports_updated_at
  before update on ad_reports
  for each row execute function update_ad_reports_updated_at();

alter table ad_reports enable row level security;

revoke all on ad_reports from anon, authenticated, public;
grant select, insert, update, delete on ad_reports to authenticated;

create policy "authenticated_full_access_ad_reports"
  on ad_reports
  for all
  to authenticated
  using (true)
  with check (true);
