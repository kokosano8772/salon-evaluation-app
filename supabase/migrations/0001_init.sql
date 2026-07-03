-- 美容室成長データベース: 初期スキーマ
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行してください（1回だけでOK）。
-- service_role keyは不要です。SQL Editorでの実行はダッシュボードの権限で行われます。

create extension if not exists pgcrypto;

-- ============================================================
-- 1. テーブル
-- ============================================================

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default '',
  area text not null default '',
  opened_year int not null default extract(year from now())::int,
  store_count int not null default 1,
  seat_count int not null default 0,
  business_hours text not null default '',
  business_days text not null default '',
  staff_count int not null default 0,
  target_customer text not null default '',
  average_unit_price int not null default 0,
  -- 一覧のスコア順ソートを高速化するための非正規化カラム。
  -- lib/growth-db/scoring.ts の calculateGrowthScore の結果を
  -- upsertMonthlyData 実行後にアプリ側から書き込む（DB側では複雑な
  -- スコアリングロジックを重複実装しない）。
  latest_score numeric,
  latest_score_year_month text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_name_phone_unique unique (name, phone)
);

create index if not exists stores_name_idx on stores using btree (lower(name));
create index if not exists stores_latest_score_idx on stores (latest_score);

create table if not exists monthly_metrics (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  year_month text not null, -- "YYYY-MM"
  revenue jsonb,
  acquisition jsonb,
  repeat_metrics jsonb,
  google_business jsonb,
  website jsonb,
  sns jsonb,
  recruiting jsonb,
  retention jsonb,
  productivity jsonb,
  brand jsonb,
  management jsonb,
  basic_snapshot jsonb,
  updated_at timestamptz not null default now(),
  constraint monthly_metrics_store_month_unique unique (store_id, year_month)
);

create index if not exists monthly_metrics_store_id_idx on monthly_metrics (store_id);

create table if not exists diagnosis_results (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores (id) on delete set null,
  salon_name text not null,
  salon_phone text not null,
  total_score int not null check (total_score between 0 and 100),
  rank text not null check (rank in ('S', 'A', 'B', 'C', 'D')),
  category_scores jsonb not null,
  answers jsonb not null,
  completed_at timestamptz not null,
  -- RPC経由（実質匿名）での書き込みのため、無条件には信用しない。
  -- スタッフが店舗詳細画面で内容を確認したら 'reviewed' に変更する運用を想定。
  status text not null default 'pending' check (status in ('pending', 'reviewed')),
  created_at timestamptz not null default now()
);

create index if not exists diagnosis_results_store_id_idx on diagnosis_results (store_id);

-- ============================================================
-- 2. Row Level Security
-- ============================================================
-- 方針: anon ロールにはテーブルへの直接アクセスを一切許可しない。
-- ダッシュボード（/dashboard 以下）はSupabase Authでログインした
-- authenticated ロールのみが読み書きできる。これが実質的なセキュリティ境界。
-- （Next.js側のmiddlewareはあくまでUX上のリダイレクトであり、本当の防御はここ）

alter table stores enable row level security;
alter table monthly_metrics enable row level security;
alter table diagnosis_results enable row level security;

-- 明示的に権限をリセットしてから必要な分だけ付与する
revoke all on stores, monthly_metrics, diagnosis_results from anon, authenticated, public;
grant select, insert, update, delete on stores, monthly_metrics, diagnosis_results to authenticated;

create policy "authenticated_full_access_stores" on stores
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_full_access_monthly_metrics" on monthly_metrics
  for all
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_full_access_diagnosis_results" on diagnosis_results
  for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- 3. 詳細診断からの唯一の書き込み経路（SECURITY DEFINER関数）
-- ============================================================
-- /diagnosis は固定パスコードのみのゲート（実質未認証）なので、
-- ここから呼ばれる書き込みは Supabase 的には anon として扱う。
-- テーブルを直接開放せず、この関数1つだけを anon に EXECUTE 許可する。

create or replace function public.link_diagnosis_to_store(
  p_salon_name text,
  p_salon_phone text,
  p_total_score int,
  p_rank text,
  p_category_scores jsonb,
  p_answers jsonb,
  p_completed_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := trim(p_salon_name);
  v_phone text := regexp_replace(p_salon_phone, '\D', '', 'g');
  v_store_id uuid;
  v_recent_count int;
  v_diagnosis_id uuid;
begin
  if v_name = '' or length(v_name) > 200 then
    raise exception 'invalid input';
  end if;
  if v_phone = '' or length(v_phone) > 20 then
    raise exception 'invalid input';
  end if;
  if p_total_score < 0 or p_total_score > 100 then
    raise exception 'invalid input';
  end if;
  if p_rank not in ('S', 'A', 'B', 'C', 'D') then
    raise exception 'invalid input';
  end if;

  -- find-or-create をatomicに行う
  insert into stores (name, phone)
  values (v_name, v_phone)
  on conflict (name, phone) do nothing
  returning id into v_store_id;

  if v_store_id is null then
    select id into v_store_id from stores where name = v_name and phone = v_phone;
  end if;

  if v_store_id is null then
    raise exception 'unable to process request';
  end if;

  -- 実店舗への偽データ大量投稿を防ぐための簡易レート制限
  select count(*) into v_recent_count
  from diagnosis_results
  where store_id = v_store_id
    and created_at > now() - interval '24 hours';

  if v_recent_count >= 3 then
    raise exception 'rate limit exceeded';
  end if;

  insert into diagnosis_results (
    store_id, salon_name, salon_phone, total_score, rank,
    category_scores, answers, completed_at, status
  ) values (
    v_store_id, v_name, v_phone, p_total_score, p_rank,
    p_category_scores, p_answers, p_completed_at, 'pending'
  )
  returning id into v_diagnosis_id;

  update stores set updated_at = now() where id = v_store_id;

  return v_diagnosis_id;
end;
$$;

revoke all on function public.link_diagnosis_to_store from public;
grant execute on function public.link_diagnosis_to_store to anon;
