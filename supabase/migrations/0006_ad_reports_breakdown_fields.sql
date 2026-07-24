-- 広告レポートの性別・時間帯別・年齢別の内訳を保存するカラムを追加。
-- Instagram/Meta広告レポートのテンプレートに必要な項目だが、Google広告側でも
-- 同じ切り口（性別・時間帯・年齢）が使えるため、platform共通のカラムにする。
-- 既存のad_reportsの他カラムには一切影響しない追加のみのmigration。

alter table ad_reports add column if not exists gender_breakdown jsonb;
alter table ad_reports add column if not exists hourly_clicks jsonb;
alter table ad_reports add column if not exists age_group_clicks jsonb;
alter table ad_reports add column if not exists target_age_range text not null default '';
