-- 店舗一覧の絞り込み用に、Google広告・インスタ広告（Meta広告）を実施しているかどうかの
-- フラグをstoresに追加する。ad_reportsの実績データの有無から自動判定するのではなく、
-- 店舗の基本情報編集画面で手動でチェックしてもらう運用にする
-- （過去に実施していたが今は止めている、等の実態を反映しやすくするため）。

alter table stores add column if not exists google_ads_active boolean not null default false;
alter table stores add column if not exists meta_ads_active boolean not null default false;
