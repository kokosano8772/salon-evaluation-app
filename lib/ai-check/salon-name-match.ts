// 全角英数記号を半角に変換する（U+FF01–FF5E → U+0021–007E）。1文字ずつの
// 置換で文字数は変わらないため、変換後の文字列は元の文字列と同じ位置対応になる
// （ハイライト表示で元テキストの該当箇所を切り出すのに利用できる）。
export function toHalfWidth(s: string): string {
  return s.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

// salon_nameはAIの抽出結果のため「sky（スカイ）、-outi-（オウチ）」のように
// 複数の店舗名が読点等で連結されていることがある。単純な部分一致だと連結文字列
// 全体でしか判定できず、実際の回答に1つ目の店舗名しか出てこないケースで
// 「含まれていなかった」と誤判定されるため、個別の候補名に分割する。
// さらに「名前（よみがな）」の形式は、AI検索実測の回答側が読み仮名を付けずに
// 「sky, -outi-」のように名前だけで言及することがあるため（逆に読み仮名だけ
// 言及されることも想定し）、括弧の前後も別候補として追加する。
export function splitSalonNames(salonName: string): string[] {
  const parts = salonName
    .split(/[、,/・\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const candidates = new Set<string>();
  const addWithHyphenVariant = (name: string) => {
    if (!name) return;
    candidates.add(name);
    // "-outi-"のように装飾目的で前後にハイフンを付けた店名は、AIが
    // ハイフン無し（"outi"）で言及することがあるため、その形も候補に加える。
    const stripped = name.replace(/^[-‐–—ー]+|[-‐–—ー]+$/g, "");
    if (stripped && stripped !== name) candidates.add(stripped);
  };
  for (const part of parts) {
    addWithHyphenVariant(part);
    const match = part.match(/^(.*?)[（(]([^）)]*)[）)]\s*$/);
    if (match) {
      const [, bare, reading] = match;
      addWithHyphenVariant(bare.trim());
      addWithHyphenVariant(reading.trim());
    }
  }
  return Array.from(candidates);
}

function normalizeForMatch(s: string): string {
  return toHalfWidth(s).replace(/\s+/g, "").toLowerCase();
}

// AIの自己申告ではなく、実際の回答テキストに店舗名（のいずれか）が含まれるかを
// コード側で決定的に判定する（設計書34章の「点数をAIに任せない」原則）。
export function containsSalonName(responseText: string, salonName: string): boolean {
  const names = splitSalonNames(salonName).map(normalizeForMatch).filter(Boolean);
  if (names.length === 0) return false;
  const normalizedResponse = normalizeForMatch(responseText);
  return names.some((name) => normalizedResponse.includes(name));
}
