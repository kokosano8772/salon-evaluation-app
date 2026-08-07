-- Google広告レポートの業種別ベンチマーク表示（予約/問い合わせボタンを押した割合の
-- 業種平均との比較）に使う、店舗の業種区分。既存店舗は空文字（未設定）のまま。

alter table stores add column if not exists business_category text not null default '';
