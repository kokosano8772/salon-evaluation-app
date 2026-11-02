-- 見積もり価格表に「中分類」と3段階料金（基本作業料／公式ライン登録／HP管理企業様）を追加する。
-- 実際の料金表（印刷物制作／WEB制作／月額運用／その他の4区分）を取り込んでみたところ、
-- ほぼ全項目が大分類（category、既存カラム）だけでなく中分類（例: チラシ・フライヤー／
-- 名刺・カード／LP制作／HP制作 等）を持ち、かつ多くの項目で3段階の単価（登録ライン特典・
-- HP管理企業様特典で安くなる）を持つことが判明したため、見積もりビルダー側のUIを
-- 「大分類→中分類→項目→料金区分」で絞り込むドリルダウン方式に変更するのに合わせて追加する。
--
-- unit_priceは「基本作業料」の単価として扱う（既存の必須カラムをそのまま流用）。
-- unit_price_line_registered／unit_price_hp_managedは、その料金区分が存在しない項目では
-- nullのままにする（見積もりビルダー側はnullの区分を選択肢として出さない）。

alter table estimate_catalog_items
  add column if not exists subcategory text not null default '',
  add column if not exists unit_price_line_registered int,
  add column if not exists unit_price_hp_managed int;

create index if not exists estimate_catalog_items_category_subcategory_sort_idx
  on estimate_catalog_items(category, subcategory, sort_order);
