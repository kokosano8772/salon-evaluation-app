import { AGE_GROUPS, AgeGroup, AgeGroupClicks, AgeGroupConversions } from "@/lib/growth-db/ad-report-types";
import { formatAdaptiveNumber } from "@/lib/growth-db/format";

interface GoogleAgeRateChartProps {
  clicks: AgeGroupClicks[];
  conversions: AgeGroupConversions[];
  accent: string;
  showCrown?: boolean;
}

// 内部の年齢区分キーは20-24（Metaの13-17/18-24をまとめた区分と共有）だが、
// Google広告の実際の年齢区分は18-24のため、表示ラベルだけこちらで上書きする。
const AGE_GROUP_DISPLAY_LABEL: Partial<Record<AgeGroup, string>> = {
  "20-24": "18-24歳",
};

function ageGroupLabel(ageGroup: AgeGroup): string {
  return AGE_GROUP_DISPLAY_LABEL[ageGroup] ?? (ageGroup === "65+" ? "65歳~" : `${ageGroup}歳`);
}

const CHART_HEIGHT = 160;
const TICK_STEPS = 5;
// バー内に件数ラベルを収められる高さの目安（それ未満はバーの上に出す）
const INSIDE_LABEL_MIN_HEIGHT = 34;

// 年代別クリック数・コンバージョン数から割合(%)を算出し、割合が最も高い年代・
// コンバージョン数（＝ボタンクリック数）が最も多い年代に王冠マークを付ける
// （集客カテゴリの実物PDFの見せ方。求人カテゴリの実物では王冠は使われないため、showCrown=falseで非表示にできる）。
export default function GoogleAgeRateChart({ clicks, conversions, accent, showCrown = true }: GoogleAgeRateChartProps) {
  const clicksByGroup = new Map(clicks.map((c) => [c.ageGroup, c.clicks]));
  const conversionsByGroup = new Map(conversions.map((c) => [c.ageGroup, c.conversions]));

  const rows = AGE_GROUPS.map((ageGroup) => {
    const groupClicks = clicksByGroup.get(ageGroup) ?? 0;
    const groupConversions = conversionsByGroup.get(ageGroup) ?? 0;
    const rate = groupClicks > 0 ? Math.round((groupConversions / groupClicks) * 10000) / 100 : 0;
    return { ageGroup, clicks: groupClicks, conversions: groupConversions, rate };
  }).filter((r) => r.clicks > 0 || r.conversions > 0);

  if (rows.length === 0) {
    return <p className="text-sm text-gray-300 py-12 text-center">データ未入力</p>;
  }

  const maxRate = Math.max(...rows.map((r) => r.rate), 1);
  // 実物PDFに合わせ、目盛りの最大値は10%刻みの「きりのいい数字」に丸める
  const niceMax = Math.max(10, Math.ceil(maxRate / 10) * 10);
  const ticks = Array.from({ length: TICK_STEPS + 1 }, (_, i) => Math.round((niceMax * i) / TICK_STEPS));

  const bestRateGroup: AgeGroup | null = rows.reduce((best, r) => (r.rate > (best?.rate ?? -1) ? r : best), rows[0]).ageGroup;
  const bestConversionsGroup: AgeGroup | null = rows.reduce(
    (best, r) => (r.conversions > (best?.conversions ?? -1) ? r : best),
    rows[0]
  ).ageGroup;

  return (
    <div>
      <div className="flex" style={{ height: CHART_HEIGHT }}>
        <div className="flex flex-col-reverse justify-between text-[10px] text-gray-400 pr-2 shrink-0">
          {ticks.map((t) => (
            <span key={t}>{t}%</span>
          ))}
        </div>
        <div className="relative flex-1">
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{ bottom: `${(t / niceMax) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end justify-between gap-3">
            {rows.map((r) => {
              const barHeight = Math.max((r.rate / niceMax) * CHART_HEIGHT, 4);
              const countInside = barHeight >= INSIDE_LABEL_MIN_HEIGHT;
              return (
                <div key={r.ageGroup} className="flex-1 flex flex-col items-center justify-end h-full">
                  {showCrown && (bestRateGroup === r.ageGroup || (bestConversionsGroup === r.ageGroup && bestConversionsGroup !== bestRateGroup)) && (
                    <div className="flex gap-0.5 mb-0.5 h-4">
                      {bestRateGroup === r.ageGroup && <span title="割合が最も高い年代">👑</span>}
                      {bestConversionsGroup === r.ageGroup && bestConversionsGroup !== bestRateGroup && (
                        <span className="opacity-60" title="ボタンクリック数が最も多い年代">
                          👑
                        </span>
                      )}
                    </div>
                  )}
                  {!countInside && <p className="text-[10px] text-gray-400">（{formatAdaptiveNumber(r.conversions)}件）</p>}
                  <p className="text-xs font-bold text-charcoal-900">{r.rate.toFixed(2)}%</p>
                  <div
                    className="w-full max-w-[56px] rounded-t-2xl mt-1 flex items-end justify-center"
                    style={{ height: `${barHeight}px`, backgroundColor: accent }}
                  >
                    {countInside && (
                      <p className="text-[10px] text-white font-semibold mb-1.5">（{formatAdaptiveNumber(r.conversions)}件）</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex mt-1 border-t border-gray-100 pt-1.5">
        <div className="pr-2 shrink-0" style={{ width: "1.5em" }} />
        <div className="flex-1 flex justify-between gap-3">
          {rows.map((r) => (
            <p key={r.ageGroup} className="flex-1 text-center text-[11px] text-gray-500">
              {ageGroupLabel(r.ageGroup)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
