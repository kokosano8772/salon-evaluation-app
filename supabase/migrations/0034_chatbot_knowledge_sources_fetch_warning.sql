-- URL取り込み時に、取得できた文字数が極端に少ない場合の警告を保持する。
-- JavaScriptで後から表示を組み立てるタイプのサイト（SPA）だと、サーバー側の
-- 素のHTML取得ではほぼ中身が空のまま取り込まれてしまうことがあり、それに
-- 気づかず空の内容を承認してしまうリスクがあるため、取得時に簡易チェックして
-- 残しておき、管理画面側で常時表示できるようにする。
alter table chatbot_knowledge_sources
  add column if not exists fetch_warning text not null default '';
