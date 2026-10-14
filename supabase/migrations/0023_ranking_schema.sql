-- WEBランキング（Web価値ランキング）機能のスキーマ。設計書
-- salon_web_value_ranking_app_design_spec_v1.md を参考にした実装用のたたき台
-- （Phase 1: スキーマ＋HPルーブリック＋検証）。
--
-- 既存の成長データベース（stores等）とは独立したテーブル群にする。stores は
-- 所有者カラムが無く「ログインしているスタッフなら誰でも全件読み書きできる」
-- 社内共有CRM的なRLS（0001_init.sqlの authenticated_full_access_stores）であり、
-- 評価根拠・採点基準バージョン・公開承認状態といった本機能に必要な概念も無いため、
-- stores への機能追加ではなく ai_check_diagnoses と同じ設計（RLSで全ロールを
-- ブロックし、service_role 経由のAPIルートのみでアクセスする）を踏襲する。
-- テーブル名は stores との衝突を避けるため ranking_ プレフィックスを付ける。
--
-- このテーブル群はanon向けの公開ツールではなくスタッフ向け管理機能のため、
-- /api/web-ranking/* の各ルートは competitor-search/route.ts と同様に
-- auth.getUser() による認証チェックを自前で行うこと（RLSはservice_role以外
-- 全ブロックなので「ログインしていること」自体はAPIルート側の責務になる）。

create table if not exists ranking_salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- enumにせず自由文字列にしておく（美容院以外への対象拡大は設計書11章の
  -- 未確定事項で、後からデータだけ広げられるようにするため）。
  business_category text not null default 'hair_salon',
  prefecture text not null default '',
  city text not null default '',
  address text not null default '',
  store_count int,
  notes text not null default '',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ranking_web_assets (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references ranking_salons(id) on delete cascade,
  site_type text not null check (site_type in ('hp', 'acquisition_lp', 'recruitment_lp')),
  url text not null,
  label text not null default '',
  is_active boolean not null default true,
  registered_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ranking_web_assets_salon_id_idx on ranking_web_assets(salon_id);

create table if not exists ranking_criteria_versions (
  id uuid primary key default gen_random_uuid(),
  site_type text not null check (site_type in ('hp', 'acquisition_lp', 'recruitment_lp')),
  version_label text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  description text not null default '',
  created_at timestamptz not null default now()
);

-- サイト種別ごとに有効なルーブリックは常に1つだけに制限する。
create unique index if not exists ranking_criteria_versions_one_active_per_site_type
  on ranking_criteria_versions(site_type) where status = 'active';

create table if not exists ranking_criteria_items (
  id uuid primary key default gen_random_uuid(),
  criteria_version_id uuid not null references ranking_criteria_versions(id) on delete cascade,
  -- バージョンを跨いで同じ項目を追跡できるよう、意味的に安定したキーにする
  -- （例: "seo_title_present"）。評価基準を改訂しても経年比較ができるようにするため。
  item_key text not null,
  category text not null,
  label text not null,
  max_score numeric not null,
  evaluation_method text not null check (evaluation_method in ('rule', 'ai', 'manual', 'deferred')),
  -- 設計書4.5「単店舗・多店舗の公平性」: 適用されない項目は0点ではなく「対象外」にする。
  applicability text not null default 'always' check (applicability in ('always', 'multi_store_only', 'conditional')),
  sort_order int not null default 0,
  unique (criteria_version_id, item_key)
);

create index if not exists ranking_criteria_items_version_id_idx on ranking_criteria_items(criteria_version_id);

create table if not exists ranking_audit_runs (
  id uuid primary key default gen_random_uuid(),
  web_asset_id uuid not null references ranking_web_assets(id) on delete cascade,
  criteria_version_id uuid not null references ranking_criteria_versions(id),
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  crawl_warning text,
  crawl_error text,
  total_score numeric,
  total_max_score numeric,
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed', 'reviewed_ok', 'reviewed_flagged')),
  reviewed_by text,
  reviewed_at timestamptz,
  triggered_by text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ranking_audit_runs_web_asset_id_idx on ranking_audit_runs(web_asset_id);

create table if not exists ranking_audit_scores (
  id uuid primary key default gen_random_uuid(),
  audit_run_id uuid not null references ranking_audit_runs(id) on delete cascade,
  criteria_item_id uuid not null references ranking_criteria_items(id),
  score numeric not null,
  -- criteria_items.max_score のスナップショット。後から配点を改訂しても
  -- 過去の診断結果が書き換わらないようにする。
  max_score numeric not null,
  -- AI Checkの4値（pass/fail/partial/unknown）に対象外(not_applicable)を追加した5値。
  status text not null check (status in ('pass', 'fail', 'partial', 'unknown', 'not_applicable')),
  unique (audit_run_id, criteria_item_id)
);

create index if not exists ranking_audit_scores_run_id_idx on ranking_audit_scores(audit_run_id);

create table if not exists ranking_audit_evidence (
  id uuid primary key default gen_random_uuid(),
  audit_score_id uuid not null references ranking_audit_scores(id) on delete cascade,
  source_url text,
  -- 全文は保存しない。設計書11章「公開する評価根拠の範囲」の未確定事項への
  -- 仮仕様として、著作権・個人情報配慮のため短い抜粋のみ保存する
  -- （文字数上限は lib/web-ranking/config.ts で管理）。
  excerpt text not null default '',
  note text not null default '',
  confidence text not null default 'high' check (confidence in ('high', 'medium', 'low')),
  created_at timestamptz not null default now()
);

create index if not exists ranking_audit_evidence_score_id_idx on ranking_audit_evidence(audit_score_id);

alter table ranking_salons enable row level security;
alter table ranking_web_assets enable row level security;
alter table ranking_criteria_versions enable row level security;
alter table ranking_criteria_items enable row level security;
alter table ranking_audit_runs enable row level security;
alter table ranking_audit_scores enable row level security;
alter table ranking_audit_evidence enable row level security;
-- ポリシーを一切作らない（ai_check_diagnosesと同じ方針）。anon/authenticatedの
-- どちらにも直接アクセスさせず、service_role（lib/supabase/admin.ts）経由の
-- APIルートのみで読み書きする。ログイン確認はAPIルート側でauth.getUser()により行う。
