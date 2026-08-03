-- 広告レポートに「集客」「求人」の区分を追加する。
-- Google広告では1店舗に集客目的・求人目的の複数キャンペーンが混在し、
-- キャンペーン名からの自動判別ができないため、同期のたびに手動で区分を選び、
-- 同じ店舗・同じ月でも区分ごとに別レコードとして保存できるようにする。
-- 既存データ（Meta広告分含む）は全て「集客（acquisition）」として扱う。

alter table ad_reports
  add column if not exists category text not null default 'acquisition'
  check (category in ('acquisition', 'recruitment'));

alter table ad_reports drop constraint if exists ad_reports_store_id_year_month_platform_key;

alter table ad_reports
  add constraint ad_reports_store_id_year_month_platform_category_key
  unique (store_id, year_month, platform, category);
