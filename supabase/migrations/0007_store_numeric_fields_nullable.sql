-- 店舗の基本情報のうち、わからない場合に「不明」として空にできるようにする。
-- 既存の他カラムには一切影響しない変更のみ。

alter table stores alter column opened_year drop not null;
alter table stores alter column store_count drop not null;
alter table stores alter column seat_count drop not null;
alter table stores alter column staff_count drop not null;
alter table stores alter column average_unit_price drop not null;
