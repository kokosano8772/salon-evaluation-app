// growth-db 全体で使い回す表示フォーマッタ

export function formatYen(value: number): string {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("ja-JP");
}

// コンバージョン数など、整数のことが多いが按分計測で小数になることもある値の表示用。
// 整数ならそのまま、小数なら小数第2位までにする（"9回"／"34.13回" のように）。
export function formatAdaptiveNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

// 割合グラフのY軸目盛りを「きりのいい間隔」で生成する（D3等で使われる標準的な
// nice-number方式）。単純に最大値を5等分するだけだと、例えば最大値60%のとき
// 12%刻み(0,12,24,36,48,60)のような半端な目盛りになってしまうため、
// 間隔そのものを1・2・5・10のいずれか(×10のべき乗)に丸めてから目盛りを作る。
export function niceAxisTicks(maxValue: number, targetTickCount = 6): { niceMax: number; ticks: number[] } {
  const safeMax = Math.max(maxValue, 1);
  const rawStep = safeMax / targetTickCount;
  const exponent = Math.floor(Math.log10(rawStep));
  const magnitude = Math.pow(10, exponent);
  const residual = rawStep / magnitude;
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  const step = niceResidual * magnitude;
  const niceMax = Math.ceil(safeMax / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax + step / 2; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return { niceMax, ticks };
}

// "2024-03" -> "2024年3月"
export function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${year}年${Number(month)}月`;
}

// "2024-03" -> "3月"
export function formatMonthShortLabel(yearMonth: string): string {
  const [, month] = yearMonth.split("-");
  return `${Number(month)}月`;
}

export function shiftYearMonth(yearMonth: string, offset: number): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ココデザイン独自診断スコア（100点満点）の帯に応じた表示色・ラベル
export function growthScoreColor(score: number): string {
  if (score >= 80) return "#C4788A";
  if (score >= 65) return "#7C9EB5";
  if (score >= 50) return "#9B8DBF";
  if (score >= 35) return "#6BAB8A";
  return "#E08B6B";
}

export function growthScoreLabel(score: number): string {
  if (score >= 80) return "非常に好調";
  if (score >= 65) return "好調";
  if (score >= 50) return "堅調";
  if (score >= 35) return "要改善";
  return "要注意";
}
