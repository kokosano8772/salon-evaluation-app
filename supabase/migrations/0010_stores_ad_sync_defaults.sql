-- 広告レポートAPI同期の「アカウントID」「キャンペーン名の絞り込みキーワード」を
-- 店舗×プラットフォーム×区分ごとに記憶しておくためのカラム。
-- 一度成功した組み合わせを保存しておき、以降どの月の同期でも自動で読み込んで使う
-- （毎月同じ値を手入力する手間・不安定な自動推測をやめるため）。
--
-- 形式: { "meta:acquisition": { "accountId": "...", "campaignNameFilter": "..." },
--         "google:acquisition": {...}, "google:recruitment": {...} }

alter table stores add column if not exists ad_sync_defaults jsonb not null default '{}';
