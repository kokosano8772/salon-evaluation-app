-- 求人カテゴリのGoogle広告レポートAI分析で読み込ませる、求人専用LPのURL。
-- ホームページ・HPBとは別の、募集要項を載せた専用ページであることが多いため独立させる。
-- 既存店舗は空文字（未設定）のまま。

alter table stores add column if not exists recruitment_lp_url text not null default '';
