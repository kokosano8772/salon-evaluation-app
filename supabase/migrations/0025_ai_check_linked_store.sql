-- 診断結果の保管庫（/dashboard/vault）で、AIチェック診断とstoresの手動連携を
-- 可能にする。通常はURL正規化による自動連携（lib/growth-db/url-match.ts）だが、
-- 登録URLと診断時に入力したURLが食い違う等で自動連携できないケースのために、
-- スタッフが手動で紐付け・解除できるようにする（手動設定がある場合は自動連携より
-- 優先する）。
alter table ai_check_diagnoses
  add column if not exists linked_store_id uuid references stores (id) on delete set null;

create index if not exists ai_check_diagnoses_linked_store_id_idx on ai_check_diagnoses (linked_store_id);
