-- 店舗削除時にdiagnosis_resultsも一緒に削除されるようにする。
-- （0001時点ではON DELETE SET NULLだったため、店舗を削除しても診断連携履歴が
-- 孤立レコードとして残ってしまっていた。店舗削除＝関連データも完全に削除、という
-- 挙動に統一する）
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行してください。

alter table diagnosis_results
  drop constraint if exists diagnosis_results_store_id_fkey;

alter table diagnosis_results
  add constraint diagnosis_results_store_id_fkey
  foreign key (store_id) references stores (id) on delete cascade;
