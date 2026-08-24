-- Google広告レポートのAI分析で、サロンの実際のホームページ・HPBページの内容を
-- 読み込ませて具体的な提案（リンク切れ・情報不足など）を生成できるようにする。
-- 既存店舗は空文字（未設定）のまま。

alter table stores add column if not exists homepage_url text not null default '';
alter table stores add column if not exists hotpepper_url text not null default '';
