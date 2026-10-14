-- HPルーブリック初期版（v1, status=draft）の投入。配点は設計書
-- salon_web_value_ranking_app_design_spec_v1.md 4.2章の配点案（合計100点、6カテゴリ）
-- に沿う。ブランド・デザイン・可読性カテゴリ（15点）は画像認識AIが必要なため
-- Phase 1では未実装・evaluation_method='deferred'とし、診断の度にnot_applicableを
-- 書く（lib/web-ranking/scoring.tsが対象外として分母からも除外する）。
--
-- 少数の実サイトで検証し、項目の曖昧さ・採点のばらつきが無いことを確認してから
-- statusをdraft→activeに切り替えること（設計書Phase 1「評価基準の初期バージョンを
-- 固定」に相当）。

with new_version as (
  insert into ranking_criteria_versions (site_type, version_label, status, description)
  values ('hp', 'v1', 'draft', '初期HPルーブリック（Phase 1、仮仕様）。検証後にactiveへ切り替える')
  returning id
)
insert into ranking_criteria_items (criteria_version_id, item_key, category, label, max_score, evaluation_method, applicability, sort_order)
select new_version.id, v.item_key, v.category, v.label, v.max_score, v.evaluation_method, v.applicability, v.sort_order
from new_version, (values
  -- SEO・地域検索（20点）
  ('seo_title_present', 'SEO・地域検索', 'titleタグが設定されている', 2, 'rule', 'always', 1),
  ('seo_meta_description_present', 'SEO・地域検索', 'meta descriptionが設定されている', 2, 'rule', 'always', 2),
  ('seo_heading_structure', 'SEO・地域検索', 'H1がちょうど1つ・H2が1つ以上ある', 3, 'rule', 'always', 3),
  ('seo_canonical_present', 'SEO・地域検索', 'canonicalタグが設定されている', 1, 'rule', 'always', 4),
  ('seo_noindex_absent', 'SEO・地域検索', 'noindexが設定されていない', 2, 'rule', 'always', 5),
  ('seo_sitemap_present', 'SEO・地域検索', 'sitemap.xmlが公開されている', 1, 'rule', 'always', 6),
  ('seo_structured_data_local_business', 'SEO・地域検索', '店舗情報系の構造化データ（LocalBusiness等）がある', 3, 'rule', 'always', 7),
  ('seo_address_present', 'SEO・地域検索', '住所・地域情報が明確に記載されている', 3, 'rule', 'always', 8),
  ('seo_region_name_in_title_or_heading', 'SEO・地域検索', '登録された地域名がtitle・見出しに含まれる', 3, 'rule', 'always', 9),

  -- 店舗・メニュー情報（20点）
  ('menu_list_present', '店舗・メニュー情報', 'メニュー一覧がある', 4, 'rule', 'always', 10),
  ('menu_price_duration_clear', '店舗・メニュー情報', '料金・所要時間が明確', 3, 'rule', 'always', 11),
  ('business_hours_clear', '店舗・メニュー情報', '営業時間・定休日が明確', 3, 'rule', 'always', 12),
  ('access_info_present', '店舗・メニュー情報', 'アクセス情報が明確', 4, 'rule', 'always', 13),
  ('staff_intro_present', '店舗・メニュー情報', 'スタイリスト紹介がある', 3, 'rule', 'always', 14),
  ('multi_store_info_present', '店舗・メニュー情報', '店舗別情報（店舗一覧）が整理されている', 3, 'rule', 'multi_store_only', 15),

  -- 集客導線・コンバージョン（25点）
  ('booking_flow_present', '集客導線・コンバージョン', '予約導線がある', 6, 'rule', 'always', 16),
  ('cta_visibility', '集客導線・コンバージョン', 'CTA（予約・問い合わせ）の視認性が高い', 6, 'ai', 'always', 17),
  ('tel_link_present', '集客導線・コンバージョン', '電話番号がtel:リンク化されている', 5, 'rule', 'always', 18),
  ('contact_channel_variety', '集客導線・コンバージョン', '問い合わせ手段が複数用意されている', 4, 'rule', 'always', 19),
  ('cta_consistency', '集客導線・コンバージョン', 'CTAが主要ページ間で一貫している', 4, 'ai', 'always', 20),

  -- サイト構造・技術的品質（10点）
  ('mobile_viewport_present', 'サイト構造・技術的品質', 'モバイル対応（viewport）している', 3, 'rule', 'always', 21),
  ('internal_links_sufficient', 'サイト構造・技術的品質', '内部リンクが十分ある', 2, 'rule', 'always', 22),
  ('https_enabled', 'サイト構造・技術的品質', 'HTTPS化されている', 2, 'rule', 'always', 23),
  ('robots_txt_present', 'サイト構造・技術的品質', 'robots.txtが公開されている', 1, 'rule', 'always', 24),
  ('no_broken_links', 'サイト構造・技術的品質', 'リンク切れが無い', 2, 'rule', 'always', 25),

  -- 採用情報（10点）
  ('recruit_page_linked', '採用情報', '採用ページへの導線がある', 4, 'rule', 'always', 26),
  ('recruit_conditions_clear', '採用情報', '募集職種・条件が明確', 3, 'ai', 'always', 27),
  ('recruit_apply_method_clear', '採用情報', '応募方法が明確', 3, 'rule', 'always', 28),

  -- ブランド・デザイン・可読性（15点、Phase 1は未実装）
  ('brand_concept_clarity', 'ブランド・デザイン・可読性', 'コンセプトが視覚的に伝わる（Phase 1未実装）', 5, 'deferred', 'always', 29),
  ('design_consistency', 'ブランド・デザイン・可読性', 'デザインの一貫性（Phase 1未実装）', 5, 'deferred', 'always', 30),
  ('readability', 'ブランド・デザイン・可読性', '可読性（Phase 1未実装）', 5, 'deferred', 'always', 31)
) as v(item_key, category, label, max_score, evaluation_method, applicability, sort_order);
