-- Google広告レポートの「クリックが多かった検索語句」表示に使う、検索語句別の
-- クリック数（店舗名を含む語句は同期時に除外済み）。

alter table ad_reports add column if not exists search_terms jsonb;
