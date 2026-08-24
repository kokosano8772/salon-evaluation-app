-- ホームページ・HPB・求人LPのURLを、複数支店に対応できるよう
-- 「店舗名+URL」の配列(jsonb)に変更する。
-- 0015/0016で追加したtext列(単一URL)にはまだ実データが無いため、置き換える。

alter table stores drop column if exists homepage_url;
alter table stores drop column if exists hotpepper_url;
alter table stores drop column if exists recruitment_lp_url;

alter table stores add column if not exists homepage_urls jsonb not null default '[]';
alter table stores add column if not exists hotpepper_urls jsonb not null default '[]';
alter table stores add column if not exists recruitment_lp_urls jsonb not null default '[]';
