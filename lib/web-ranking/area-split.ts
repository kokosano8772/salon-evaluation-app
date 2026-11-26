// 住所/地域の自由記述文字列（成長DBのstore.areaやGoogle PlacesのformattedAddress）
// から、ranking_salons.prefecture/cityを雑に分離するヒューリスティック。
// 完全な住所パーサーではない。cityは区・町名以降を厳密に切り出さず、都道府県名より
// 後ろの残り全部とする（cityは表示用メタデータにしか使われておらず、絞り込みに
// 使うのはprefectureのみのため許容する。詳細はstore-ranking/own-asset route参照）。
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

export function splitPrefectureCity(area: string): { prefecture: string; city: string } {
  const trimmed = (area ?? "").trim();
  for (const pref of PREFECTURES) {
    const idx = trimmed.indexOf(pref);
    if (idx !== -1) {
      return { prefecture: pref, city: trimmed.slice(idx + pref.length).trim() };
    }
  }
  return { prefecture: "", city: trimmed };
}
