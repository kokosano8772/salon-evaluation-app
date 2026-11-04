-- 見積もりヘッダのvalid_until（見積有効期限）は実運用で使わないとのことで、
-- 代わりに「制作日（いつ作業する予定か）」を持たせる。意味が変わるため
-- 単なるリネームではなくカラム名自体をproduction_dateに変更する。

alter table estimates rename column valid_until to production_date;
