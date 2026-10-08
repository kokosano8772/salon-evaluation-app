-- 美容室AI対策診断（Salon AI Check、Phase 1）の結果を保存するテーブル。
-- 既存のstores/diagnosis_resultsとは独立（URLを入れるだけの公開ツールで、
-- 店舗登録や認証を前提としないため）。結果画面はURL(/ai-check/[id])を知っていれば
-- 誰でも閲覧できる、既存の診断結果共有と同じ考え方。
create table if not exists ai_check_diagnoses (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  total_score int not null,
  rank text not null,
  summary text not null default '',
  target text not null default '',
  strengths jsonb not null default '[]',
  weaknesses jsonb not null default '[]',
  missing_information jsonb not null default '[]',
  recommendations jsonb not null default '[]',
  category_scores jsonb not null default '[]',
  diagnosis_items jsonb not null default '[]',
  -- トップページ自体が取得できなかった場合などの注記（nullなら正常にクロールできた）
  crawl_warning text,
  -- 簡易レートリミット用（公開エンドポイントの乱用防止、1時間に数回まで等）
  client_ip text,
  created_at timestamptz not null default now()
);

create index if not exists ai_check_diagnoses_client_ip_created_at_idx
  on ai_check_diagnoses (client_ip, created_at);

alter table ai_check_diagnoses enable row level security;
-- ポリシーを一切作らない（api_tokensと同じ方針）。client_ipを含むためanon/authenticated
-- ロールには一切公開せず、service_role（lib/supabase/admin.ts）経由でのみ読み書きする。
-- 結果画面への表示は、/api/ai-check/diagnose/[id] がclient_ipを除いて返すAPI経由で行う。
