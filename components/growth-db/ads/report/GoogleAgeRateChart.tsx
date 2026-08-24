import { AGE_GROUPS, AgeGroup, AgeGroupClicks, AgeGroupConversions } from "@/lib/growth-db/ad-report-types";
import { formatAdaptiveNumber, niceAxisTicks } from "@/lib/growth-db/format";

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

// バーが伸びる範囲の高さは求人(王冠なし)・集客(王冠あり)で共通の固定値にする。
// 王冠の有無で変えるのはCHART_HEIGHT（＝ラベル分を上乗せする量）の方にし、
// 集客だけ目盛りが窮屈になって読み取りづらくなることがないようにする。
const BAR_AREA_HEIGHT = 90;
// バー内に件数ラベルを収められる高さの目安（それ未満はバーの上に出す）
const INSIDE_LABEL_MIN_HEIGHT = 34;
// バーの上に乗る「王冠+割合(%)ラベル」の高さぶん。これをCHART_HEIGHTの計算に
//含めないと、割合が高いバー（特に王冠が付くバー）ではラベル分の高さがはみ出し、
// Y軸目盛りとバーの対応がズレる不具合になる。
const LABEL_RESERVE_WITH_CROWN = 44;
const LABEL_RESERVE_NO_CROWN = 26;

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
  // 目盛り間隔が1/2/5/10のいずれか(×10のべき乗)になる「きりのいい数字」に丸める
  const { niceMax, ticks } = niceAxisTicks(maxRate);

  const bestRateGroup: AgeGroup | null = rows.reduce((best, r) => (r.rate > (best?.rate ?? -1) ? r : best), rows[0]).ageGroup;
  const bestConversionsGroup: AgeGroup | null = rows.reduce(
    (best, r) => (r.conversions > (best?.conversions ?? -1) ? r : best),
    rows[0]
  ).ageGroup;

  // 王冠が表示されうる場合は王冠+割合ラベル分、されない場合は割合ラベル分だけを
  // ラベル用に確保する。バーの伸びる範囲(BAR_AREA_HEIGHT)は固定のまま、
  // その分だけ全体の高さ(CHART_HEIGHT)を伸ばすことで、王冠の有無で目盛りの
  // 間隔が変わってしまわないようにする。
  const labelReserve = showCrown ? LABEL_RESERVE_WITH_CROWN : LABEL_RESERVE_NO_CROWN;
  const barAreaHeight = BAR_AREA_HEIGHT;
  const CHART_HEIGHT = barAreaHeight + labelReserve;

  return (
    <div>
      <div className="flex" style={{ height: CHART_HEIGHT }}>
        <div className="relative text-[10px] text-gray-400 shrink-0 text-right" style={{ height: CHART_HEIGHT, width: 40 }}>
          {/* 目盛り線と全く同じ計算式で位置を出し、transformで数値の中心を線に合わせる
              （flexboxのjustify-betweenだとラベル自体の高さ分だけ線とズレていたため）。
              絶対配置の要素はpaddingを無視するため、グラフとの隙間はrightの値で直接確保する。
              幅40pxは推移グラフ2種のRecharts YAxis(width={"{40}"})と揃えている。 */}
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute"
              style={{
                right: "0.5rem",
                bottom: `${(((t / niceMax) * barAreaHeight) / CHART_HEIGHT) * 100}%`,
                transform: "translateY(50%)",
              }}
            >
              {t}%
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute left-0 right-0 border-t"
              style={{ borderColor: "#f0f0f0", bottom: `${(((t / niceMax) * barAreaHeight) / CHART_HEIGHT) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end justify-between gap-3">
            {rows.map((r) => {
              const barHeight = Math.max((r.rate / niceMax) * barAreaHeight, 4);
              const countInside = barHeight >= INSIDE_LABEL_MIN_HEIGHT;
              return (
                <div key={r.ageGroup} className="flex-1 flex flex-col items-center justify-end h-full">
                  {showCrown && (bestRateGroup === r.ageGroup || (bestConversionsGroup === r.ageGroup && bestConversionsGroup !== bestRateGroup)) && (
                    <div className="flex gap-0.5 mb-0.5 h-4 items-center">
                      {bestRateGroup === r.ageGroup && (
                        <img src="/ad-report/crown-gold.png" alt="割合が最も高い年代" title="割合が最も高い年代" className="h-4 w-auto" />
                      )}
                      {bestConversionsGroup === r.ageGroup && bestConversionsGroup !== bestRateGroup && (
                        <img
                          src="/ad-report/crown-silver.png"
                          alt="ボタンクリック数が最も多い年代"
                          title="ボタンクリック数が最も多い年代"
                          className="h-4 w-auto"
                        />
                      )}
                    </div>
                  )}
                  {!countInside && <p className="text-[15px] text-gray-400 mb-0.5">（{formatAdaptiveNumber(r.conversions)}件）</p>}
                  <p className="text-[15px] font-bold text-charcoal-900">{r.rate.toFixed(2)}%</p>
                  <div
                    className="w-full max-w-[130px] rounded-t-md mt-1 flex items-end justify-center"
                    style={{ height: `${barHeight}px`, backgroundColor: accent }}
                  >
                    {countInside && (
                      <p className="text-[15px] text-white font-semibold mb-1.5">（{formatAdaptiveNumber(r.conversions)}件）</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="flex mt-1.5">
        <div className="shrink-0" style={{ width: 40 }} />
        <div className="flex-1 flex justify-between gap-3">
          {rows.map((r) => (
            <p key={r.ageGroup} className="flex-1 text-center text-[16px] text-gray-500">
              {ageGroupLabel(r.ageGroup)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
