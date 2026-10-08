-- Salon AI Check Phase 2: 自動診断でfail/unknownだった項目をユーザー本人が
-- 直接回答できるようにする（設計書23〜24章のギャップフィル式手動診断）。
-- ユーザーが実際に回答した内容を保持し、結果画面の「追加情報」タブで
-- 回答済みかどうかを判定・表示するために使う。
alter table ai_check_diagnoses
  add column if not exists manual_answers jsonb not null default '{}';
