-- 見積もりビルダーの選択UIを「検索＋質問フィルタ」方式に作り直すのに合わせて、
-- 価格表の各項目に「初回／一部修正／再入稿・リピート」の区分を持たせる。
-- 名刺・チラシ・DM等の印刷物制作では、同じ制作物でも
--   初回: デザイン代（フル）＋印刷代
--   一部修正: 修正割合に応じた修正料金＋印刷代
--   再入稿・リピート: 入稿手数料（修正なし）＋印刷代
-- と価格が変わり、スタッフが「これは初回か修正かリピートか」を自分で判断する
-- 手間を減らすため、フィルタチップで絞り込めるようにする。
-- 区分が無い項目（WEB制作のオプション・月額プラン・ロゴ等）はnullのままにする。

alter table estimate_catalog_items
  add column if not exists order_type text check (order_type in ('first_time', 'revision', 'resubmission'));

create index if not exists estimate_catalog_items_order_type_idx on estimate_catalog_items(order_type);
