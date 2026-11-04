-- 見積もり明細に「仕入れ料金」を追加する。価格表の単価はデザイン・作業料金のみで、
-- 印刷物などは実際の印刷費（仕入れ料金）が別途発生し、数量に比例するものではなく
-- 案件ごとに業者から取った見積もり額をそのまま定額で乗せる性質のものであるため、
-- 自動計算はせず手入力欄として追加する。
--
-- 金額(amount) = unit_price × quantity + procurement_cost として扱う
-- （lib/estimates/resolve-line-items.ts参照）。

alter table estimate_line_items
  add column if not exists procurement_cost int not null default 0;
