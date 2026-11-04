-- 見積もり明細に、料金区分（公式ライン登録／HP管理企業様）による割引額を
-- 表示用に保持するカラムを追加する。実際の見積書では「デザイン代 ¥20,000」
-- 「ホームページ管理サロン様特別値引き -¥13,000」のように割引額を独立した行で
-- 見せているため、それに合わせる。
--
-- unit_priceの意味・amountの計算式（unit_price × quantity + procurement_cost）は
-- 変更しない（unit_priceは引き続き「選んだ料金区分での単価＝既に割引後の値」）。
-- discount_amountはあくまで表示用の付随情報で、「割引前の単価はunit_price+
-- discount_amountだった」ことを再現するために使う（lib/estimates/resolve-line-items.ts参照）。

alter table estimate_line_items
  add column if not exists discount_amount int not null default 0,
  add column if not exists discount_label text not null default '';
