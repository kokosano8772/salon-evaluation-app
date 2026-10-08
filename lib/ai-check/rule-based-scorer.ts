// ルールベース採点（設計書34章: 「HTML・構造・存在確認」はAIに判断させず、
// コード側で機械的に確定させる）。意味・専門性・内容の質に関わる項目は
// build-ai-check-prompt.ts側でAIに判定させ、ここでは扱わない。
//
// カテゴリ別の内訳（details.mdのA〜Hのうち、ここで数値確定できる項目のみ）:
// A(15点中7点) D(15点満点) E(15点中5点) C(15点中3点) F(10点中3点) G(10点中6点、残り4点はunknown)

import { ParsedPage } from "./html-parser";
import { DiagnosisItem, GoogleReviewsManualInput } from "./types";

function item(id: string, categoryId: DiagnosisItem["categoryId"], label: string, maxScore: number, pass: boolean): DiagnosisItem {
  return { id, categoryId, label, maxScore, score: pass ? maxScore : 0, status: pass ? "pass" : "fail" };
}

function unknownItem(id: string, categoryId: DiagnosisItem["categoryId"], label: string, maxScore: number): DiagnosisItem {
  return { id, categoryId, label, maxScore, score: 0, status: "unknown" };
}

const ADDRESS_PATTERN = /(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)[^\s　]{2,}[市区町村郡][^\s　]*/;
const BUSINESS_HOURS_PATTERN = /営業時間|(\d{1,2}[:：]\d{2}\s*[〜～\-]\s*\d{1,2}[:：]\d{2})/;
const CLOSED_DAY_PATTERN = /定休日|休業日/;
// ¥6,600のようなカンマ区切りの価格表記が実際の美容室サイトでは標準的なため、
// \d{3,}（3桁以上の連続した数字）だけだとカンマで区切られた金額を取りこぼす。
// [\d,]{3,}にして数字とカンマの連続にマッチさせる。
const MENU_PRICE_PATTERN = /[¥￥]\s?[\d,]{3,}|[\d,]{3,}\s?円/;
const DURATION_PATTERN = /\d{1,3}\s?分/;
const FAQ_KEYWORD_PATTERN = /faq|よくある質問|q\s*&\s*a/i;
const BLOG_URL_PATTERN = /\/(blog|news|column|article)s?\//i;
// 「スタッフ」ではなく「スタイリスト/STYLIST」を使う美容室サイトも多いため追加。
const STAFF_KEYWORD_PATTERN = /staff|スタッフ|美容師紹介|stylist|スタイリスト/i;
const MENU_KEYWORD_PATTERN = /menu|メニュー/i;

// メニュー/スタッフ/FAQ等のページ（または1ページサイトのセクション）を見分ける際、
// URLとH1だけでなくH2/H3も見る。1ページ構成のサイトでは「メニュー」「スタイリスト」
// 等の見出しはH1（ページ内で1つだけのメイン見出し）ではなくH2で書かれるのが一般的な
// ため、H1だけを見ると実在するセクションを常に見逃してしまう。
function pageMatchesKeyword(page: ParsedPage, pattern: RegExp): boolean {
  if (pattern.test(page.url)) return true;
  return [...page.h1, ...page.h2, ...page.h3].some((h) => pattern.test(h));
}

export interface RuleBasedScoringInput {
  topPage: ParsedPage;
  otherPages: ParsedPage[];
  hasSitemap: boolean;
  hasRobotsTxt: boolean;
  googleReviews: GoogleReviewsManualInput | null;
}

export function scoreWithRules(input: RuleBasedScoringInput): DiagnosisItem[] {
  const { topPage, otherPages, hasSitemap, hasRobotsTxt, googleReviews } = input;
  const allPages = [topPage, ...otherPages];
  const allText = allPages.map((p) => p.textContent).join(" ");
  const items: DiagnosisItem[] = [];

  // --- A. 店舗情報・AI理解度（15点中7点をルールで判定）---
  items.push(item("a_store_name", "store_info", "店舗名が明確", 2, !!topPage.title && topPage.title.length > 0));
  const hasAddress = ADDRESS_PATTERN.test(allText);
  items.push(item("a_address", "store_info", "住所が明確", 2, hasAddress));
  items.push(item("a_area", "store_info", "地域・エリアが明確", 2, hasAddress));
  items.push(
    item(
      "a_hours",
      "store_info",
      "営業時間・定休日が明確",
      1,
      BUSINESS_HOURS_PATTERN.test(allText) && CLOSED_DAY_PATTERN.test(allText)
    )
  );

  // --- C. メニュー・悩み解決情報（15点中3点）---
  const menuPage = allPages.find((p) => pageMatchesKeyword(p, MENU_KEYWORD_PATTERN));
  const hasMenuList = !!menuPage && MENU_PRICE_PATTERN.test(menuPage.textContent);
  items.push(item("c_menu_list", "menu", "メニュー一覧がある", 2, hasMenuList));
  const hasPriceAndDuration =
    !!menuPage && MENU_PRICE_PATTERN.test(menuPage.textContent) && DURATION_PATTERN.test(menuPage.textContent);
  items.push(item("c_price_duration", "menu", "料金・所要時間が明確", 1, hasPriceAndDuration));

  // --- D. Webサイト・技術構造（15点満点）---
  items.push(item("d_https", "web_structure", "HTTPS", 1, topPage.url.startsWith("https://")));
  items.push(item("d_title", "web_structure", "title", 1, !!topPage.title));
  items.push(item("d_meta_description", "web_structure", "meta description", 1, !!topPage.metaDescription));
  items.push(item("d_h1", "web_structure", "適切なH1", 1, topPage.h1.length === 1));
  items.push(
    item("d_heading_structure", "web_structure", "見出し構造", 2, topPage.h1.length >= 1 && topPage.h2.length >= 1)
  );
  items.push(item("d_internal_links", "web_structure", "内部リンク", 2, topPage.internalLinkCount >= 5));
  items.push(item("d_canonical", "web_structure", "canonical", 1, !!topPage.canonical));
  items.push(item("d_sitemap", "web_structure", "sitemap", 1, hasSitemap));
  items.push(item("d_robots_txt", "web_structure", "robots.txt", 1, hasRobotsTxt));
  items.push(item("d_structured_data", "web_structure", "構造化データ", 3, topPage.jsonLdTypes.length > 0));
  items.push(item("d_mobile", "web_structure", "モバイル対応", 1, topPage.hasViewportMeta));

  // --- E. コンテンツ・FAQ（15点中5点）---
  const hasFaq =
    topPage.jsonLdTypes.includes("FAQPage") ||
    allPages.some((p) => p.jsonLdTypes.includes("FAQPage")) ||
    allPages.some((p) => pageMatchesKeyword(p, FAQ_KEYWORD_PATTERN));
  items.push(item("e_faq", "content_faq", "FAQ", 3, hasFaq));
  const hasBlog = allPages.some((p) => BLOG_URL_PATTERN.test(p.url));
  items.push(item("e_blog", "content_faq", "ブログ・記事コンテンツ", 2, hasBlog));

  // --- F. スタッフ・実績・信頼性（10点中3点）---
  const staffPage = allPages.find((p) => pageMatchesKeyword(p, STAFF_KEYWORD_PATTERN));
  items.push(item("f_staff_intro", "staff", "スタッフ紹介", 2, !!staffPage));
  items.push(item("f_staff_photos", "staff", "店舗・スタッフの写真", 1, !!staffPage && staffPage.imageAltTexts.length > 0));

  // --- G. Google・口コミ・外部情報（10点中6点。手動入力。残り2項目はPhase 1では確認手段が無いためunknown）---
  if (googleReviews) {
    items.push(item("g_gbp", "google_reviews", "Googleビジネスプロフィール登録", 2, googleReviews.hasGoogleBusinessProfile));
    items.push(item("g_review_count", "google_reviews", "Google口コミ数", 2, googleReviews.reviewCount >= 20));
    items.push(item("g_rating", "google_reviews", "Google評価", 2, googleReviews.averageRating >= 4.0));
  } else {
    items.push(unknownItem("g_gbp", "google_reviews", "Googleビジネスプロフィール登録", 2));
    items.push(unknownItem("g_review_count", "google_reviews", "Google口コミ数", 2));
    items.push(unknownItem("g_rating", "google_reviews", "Google評価", 2));
  }
  items.push(unknownItem("g_review_content", "google_reviews", "口コミに施術内容が含まれる", 2));
  items.push(unknownItem("g_cross_platform_match", "google_reviews", "他媒体との店舗情報一致", 2));

  return items;
}
