-- Salon AI Check プロ版の「AI検索実測」機能（設計書Phase3の一部）。
-- salon_name/suggested_queriesはPro-finalize時にGeminiが既存コールのついでに生成
-- （追加コスト無し）。search_check_results/search_check_run_atは、結果画面の
-- オプトインボタンから実際にAIへ検索質問を投げた結果（別エンドポイントでのみ更新）。
alter table ai_check_diagnoses
  add column if not exists salon_name text not null default '',
  add column if not exists suggested_queries jsonb not null default '[]',
  add column if not exists search_check_results jsonb not null default '[]',
  add column if not exists search_check_run_at timestamptz;
