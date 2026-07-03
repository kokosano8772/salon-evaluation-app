-- 「同規模・地域平均との比較」機能のための追加フィールド。
-- 商圏タイプ・店舗形態は既存データにはないため、nullable/デフォルト空文字で追加し、
-- 既存店舗は編集画面から後追いで設定する想定。
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行してください。

alter table stores
  add column if not exists trade_area text not null default '';

alter table stores
  add column if not exists store_format text not null default '';
