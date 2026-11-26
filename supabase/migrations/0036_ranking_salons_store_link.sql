-- WEBランキング機能に「自社サイト」の概念を追加する。
-- 既存のranking_salonsは成長データベースのstoresと無関係に、競合も自社も
-- 区別なく手入力で登録する設計だった。店舗詳細ページから「自社サイト vs
-- 地域の競合」を一発で見られるようにするため、ranking_salonsに
-- 「この行はどのstoresの自社サイトか」を表すリンクを追加する。
-- 0025_ai_check_linked_store.sql（ai_check_diagnoses.linked_store_id）と同じ
-- パターン。既存の検索・採点フロー、グローバルランキング一覧には一切影響しない
-- （追加のみ）。
alter table ranking_salons
  add column if not exists linked_store_id uuid references stores (id) on delete set null;

-- 1店舗につき「自社」のranking_salons行は常に高々1件にする
-- （store-ranking/own-asset がfind-or-createする際の整合性保証）。
create unique index if not exists ranking_salons_linked_store_id_key
  on ranking_salons (linked_store_id)
  where linked_store_id is not null;
