-- Google広告レポートの「予約/問い合わせボタンを押した割合」表示に使う、
-- コンバージョンアクション名ごとの内訳（店舗ごとに項目名・項目数が異なるため、
-- 固定カラムにせずjsonb配列で保持する）。

alter table ad_reports add column if not exists conversion_action_breakdown jsonb;
