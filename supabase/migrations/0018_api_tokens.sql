-- 外部API（Meta Marketing API等）のアクセストークンを保存するテーブル。
-- これまでは環境変数(META_ACCESS_TOKEN)に固定値を置いていたが、Metaのシステムユーザー
-- トークンが最長60日で失効するようになったため、アプリ側で定期的に自動更新できるよう
-- DBに保存する形に変更する。環境変数は実行中のプロセスから書き換えられないため。
--
-- anon/authenticatedロールからは一切アクセスさせず、service_role（RLSをバイパスする
-- サーバー専用キー）からのみ読み書きする。トークン自体が機密情報のため。
create table if not exists api_tokens (
  provider text primary key,
  access_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table api_tokens enable row level security;
-- ポリシーを一切作らないことで、anon/authenticatedロールからは完全にアクセス不可にする
-- （service_roleはRLSを自動的にバイパスするため、ポリシー不要でアクセスできる）。
