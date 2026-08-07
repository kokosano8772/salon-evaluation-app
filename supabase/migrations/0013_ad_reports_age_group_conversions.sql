-- Google広告レポートの【年代別】予約/問い合わせボタンを押した割合の表示に使う、
-- 年代別のコンバージョン数（age_group_clicksとは別枠、割合計算の分子側）。

alter table ad_reports add column if not exists age_group_conversions jsonb;
