// lib/ai-check/rule-based-scorer.tsの正規表現パターンを意図的に複製したもの
// （importしない）。AI Check側の調整が、経年比較の重要な公開ランキングの
// スコアに無自覚に影響しないよう、2つの採点エンジンを分離するため。

export const ADDRESS_PATTERN =
  /(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)[^\s　]{2,}[市区町村郡][^\s　]*/;
export const BUSINESS_HOURS_PATTERN = /営業時間|(\d{1,2}[:：]\d{2}\s*[〜～\-]\s*\d{1,2}[:：]\d{2})/;
export const CLOSED_DAY_PATTERN = /定休日|休業日/;
export const MENU_PRICE_PATTERN = /[¥￥]\s?[\d,]{3,}|[\d,]{3,}\s?円/;
export const DURATION_PATTERN = /\d{1,3}\s?分/;
export const STAFF_KEYWORD_PATTERN = /staff|スタッフ|美容師紹介|stylist|スタイリスト/i;
export const MENU_KEYWORD_PATTERN = /menu|メニュー/i;
export const ACCESS_KEYWORD_PATTERN = /アクセス|access|地図|google\s?map|最寄り駅/i;
export const RECRUIT_KEYWORD_PATTERN = /recruit|採用|求人|スタッフ募集|staff\s?wanted/i;
export const BOOKING_KEYWORD_PATTERN = /ご?予約|reserve|reservation|web予約|ネット予約|オンライン予約/i;
export const CONTACT_FORM_KEYWORD_PATTERN = /お問い合わせ|contact|inquiry|問合せ/i;
// 「ラインでご予約」のようにLINEがカタカナ表記になり、かつ「ご予約」のように
// 助詞と動詞の間に敬語接頭辞が挟まることが実サイトで多いため、間に1〜3文字の
// 余裕を持たせる（実例: belin.jpの「ラインでご予約」を検出できず判明）。
export const LINE_PATTERN = /line\.me|公式line|(line|ライン)で.{0,3}(予約|問い合わせ)/i;

// schema.orgの中で、美容室サイトの「地域特化した構造化データ」と呼べる型。
// 「JSON-LDが何か1つでもあればOK」ではなく、実際に店舗情報系の型かを見る。
export const LOCAL_BUSINESS_JSONLD_TYPES = new Set([
  "LocalBusiness",
  "HairSalon",
  "BeautySalon",
  "HealthAndBeautyBusiness",
  "Organization",
]);
