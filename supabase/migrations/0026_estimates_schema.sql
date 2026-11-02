-- 見積もり作成アプリ（KOKO DESIGN社内スタッフ向け、/dashboard/estimates）のスキーマ。
-- 既存の成長データベース（stores等）とは独立したテーブル群にする方針は
-- 0023_ranking_schema.sql と同じ（storesにはクライアントの請求・連絡先に相当する
-- カラムが無く、見積もりは未登録の見込み客も対象にするため）。
-- RLSも同様の方針：全ロールをブロックし、service_role経由のAPIルート
-- （/api/estimates/*）のみでアクセスする。ログイン確認はAPIルート側で
-- auth.getUser()により行う。

create table if not exists estimate_catalog_items (
  id uuid primary key default gen_random_uuid(),
  category text not null default '',
  name text not null,
  description text not null default '',
  unit text not null default '式',
  unit_price int not null default 0,
  sort_order int not null default 0,
  -- 論理削除フラグ。物理削除するとestimate_template_itemsのon delete cascadeで
  -- プリセットが壊れるため、削除操作は常にこのフラグをfalseにするだけで行う
  -- （app/api/estimates/catalog-items/[id]/route.tsのDELETEを参照）。
  is_active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists estimate_catalog_items_category_sort_idx
  on estimate_catalog_items(category, sort_order);
create index if not exists estimate_catalog_items_is_active_idx
  on estimate_catalog_items(is_active);

create table if not exists estimate_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists estimate_templates_is_active_idx on estimate_templates(is_active);

create table if not exists estimate_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references estimate_templates(id) on delete cascade,
  catalog_item_id uuid not null references estimate_catalog_items(id) on delete cascade,
  default_quantity int not null default 1,
  sort_order int not null default 0,
  unique (template_id, catalog_item_id)
);

create index if not exists estimate_template_items_template_id_idx on estimate_template_items(template_id);

create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id) on delete set null,
  client_name text not null default '',
  client_contact text not null default '',
  title text not null default '',
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected')),
  source_template_id uuid references estimate_templates(id) on delete set null,
  subtotal int not null default 0,
  tax_rate numeric not null default 0.10,
  tax_amount int not null default 0,
  total int not null default 0,
  notes text not null default '',
  valid_until date,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists estimates_store_id_idx on estimates(store_id);
create index if not exists estimates_created_at_idx on estimates(created_at desc);

create table if not exists estimate_line_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references estimates(id) on delete cascade,
  -- 追跡用の参照のみ。nullなら価格表に無い自由入力行。on delete set nullなので
  -- 価格表項目が削除されても過去の見積もり明細（スナップショット本体）は残る。
  catalog_item_id uuid references estimate_catalog_items(id) on delete set null,
  -- 以下はすべて保存時点のスナップショット。価格表（estimate_catalog_items）を
  -- 後から変更しても、ここに保存済みの値は変わらない。
  category text not null default '',
  name text not null,
  description text not null default '',
  unit text not null default '',
  unit_price int not null default 0,
  quantity int not null default 1,
  amount int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists estimate_line_items_estimate_id_idx on estimate_line_items(estimate_id);

alter table estimate_catalog_items enable row level security;
alter table estimate_templates enable row level security;
alter table estimate_template_items enable row level security;
alter table estimates enable row level security;
alter table estimate_line_items enable row level security;
-- ポリシーを一切作らない（ranking_*・ai_check_diagnosesと同じ方針）。anon/authenticatedの
-- どちらにも直接アクセスさせず、service_role（lib/supabase/admin.ts）経由の
-- APIルートのみで読み書きする。ログイン確認はAPIルート側でauth.getUser()により行う。
