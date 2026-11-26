// 住所/地域の自由記述文字列（成長DBのstore.areaやGoogle PlacesのformattedAddress）
// から、ranking_salons.prefecture/cityを雑に分離するヒューリスティック。
// 完全な住所パーサーではない。市区町村名までで止め、それ以降の番地・建物名は
// 捨てる（丁目・番地まで含めてしまうと、同じ区内のサロンでも1件ずつ違う値に
// なってしまい、WEBランキング一覧の「市区町村」での絞り込みが機能しなくなるため）。
const PREFECTURES = [
  "北海道",
  "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県",
  "沖縄県",
];

// 都道府県名より後ろの文字列から、市区町村名の終わりまでを切り出す。
// 「〇〇市〇〇区」（政令指定都市）・「〇〇市」・「〇〇郡〇〇町/村」・「〇〇町/村」の
// パターンを優先順に試し、どれも見つからなければ番地等ごと全部をcityにする
// （見つからないより多めに残す方が、絞り込みで「該当なし」になるよりまし）。
function cutAtCityBoundary(rest: string): string {
  const cityMatch = rest.match(/^.{1,10}市/);
  if (cityMatch) {
    const afterCity = rest.slice(cityMatch[0].length);
    const wardMatch = afterCity.match(/^.{1,6}区/);
    return wardMatch ? cityMatch[0] + wardMatch[0] : cityMatch[0];
  }
  const townMatch = rest.match(/^.{1,10}郡.{1,10}[町村]/) ?? rest.match(/^.{1,10}[町村]/);
  if (townMatch) return townMatch[0];
  const wardOnlyMatch = rest.match(/^.{1,10}区/);
  if (wardOnlyMatch) return wardOnlyMatch[0];
  return rest;
}

export function splitPrefectureCity(area: string): { prefecture: string; city: string } {
  const trimmed = (area ?? "").trim();
  for (const pref of PREFECTURES) {
    const idx = trimmed.indexOf(pref);
    if (idx !== -1) {
      const rest = trimmed.slice(idx + pref.length).trim();
      return { prefecture: pref, city: cutAtCityBoundary(rest) };
    }
  }
  return { prefecture: "", city: trimmed };
}
