-- Salon AI Check を簡易版(AI呼び出し無し)とプロ版(AI呼び出しあり)に分割する。
-- 簡易版はルールベースで判定可能な範囲(100点中39点分)のみを採点するため、
-- 総合スコアの分母が診断によって変わる(簡易=39点満点、プロ=100点満点)。
-- score_maxでその分母を保持し、結果画面はtotal_score/score_maxで表示する。
-- 簡易版にはS〜Eのランク(100点満点前提)を出さないため、rankはnull許容にする。
alter table ai_check_diagnoses
  add column if not exists tier text not null default 'simple',
  add column if not exists score_max int not null default 100;

alter table ai_check_diagnoses
  alter column rank drop not null;

-- manual_answersカラムは引き続き使用（用途をプロ版のクイズ回答保存に転用）。
