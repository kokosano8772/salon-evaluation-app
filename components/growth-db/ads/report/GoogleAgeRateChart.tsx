import { AGE_GROUPS, AgeGroup, AgeGroupClicks, AgeGroupConversions } from "@/lib/growth-db/ad-report-types";

interface GoogleAgeRateChartProps {
  clicks: AgeGroupClicks[];
  conversions: AgeGroupConversions[];
  accent: string;
}

// 年代別クリック数・コンバージョン数から割合(%)を算出し、割合が最も高い年代・
// クリック数が最も多い年代に王冠マークを付ける（実物PDFの見せ方に合わせる）。
export default function GoogleAgeRateChart({ clicks, conversions, accent }: GoogleAgeRateChartProps) {
  const clicksByGroup = new Map(clicks.map((c) => [c.ageGroup, c.clicks]));
  const conversionsByGroup = new Map(conversions.map((c) => [c.ageGroup, c.conversions]));

  const rows = AGE_GROUPS.map((ageGroup) => {
    const groupClicks = clicksByGroup.get(ageGroup) ?? 0;
    const groupConversions = conversionsByGroup.get(ageGroup) ?? 0;
    const rate = groupClicks > 0 ? Math.round((groupConversions / groupClicks) * 1000) / 10 : 0;
    return { ageGroup, clicks: groupClicks, conversions: groupConversions, rate };
  }).filter((r) => r.clicks > 0 || r.conversions > 0);

  if (rows.length === 0) {
    return <p className="text-sm text-gray-300 py-12 text-center">データ未入力</p>;
  }

  const maxRate = Math.max(...rows.map((r) => r.rate), 1);
  const bestRateGroup: AgeGroup | null = rows.reduce((best, r) => (r.rate > (best?.rate ?? -1) ? r : best), rows[0]).ageGroup;
  const bestClicksGroup: AgeGroup | null = rows.reduce((best, r) => (r.clicks > (best?.clicks ?? -1) ? r : best), rows[0]).ageGroup;

  return (
    <div>
      <div className="flex items-end justify-between gap-2" style={{ height: 180 }}>
        {rows.map((r) => (
          <div key={r.ageGroup} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="flex gap-0.5 mb-1 h-4">
              {bestRateGroup === r.ageGroup && <span title="割合が最も高い年代">👑</span>}
              {bestClicksGroup === r.ageGroup && bestClicksGroup !== bestRateGroup && (
                <span className="opacity-60" title="クリック数が最も多い年代">
                  👑
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-charcoal-900">{r.rate.toFixed(2)}%</p>
            <div
              className="w-full max-w-[42px] rounded-t-md mt-1"
              style={{ height: `${Math.max((r.rate / maxRate) * 90, 4)}px`, backgroundColor: accent }}
            />
            <p className="text-[10px] text-gray-400 mt-1">（{r.conversions.toFixed(2)}件）</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-2 mt-1 border-t border-gray-100 pt-1.5">
        {rows.map((r) => (
          <p key={r.ageGroup} className="flex-1 text-center text-[11px] text-gray-500">
            {r.ageGroup === "65+" ? "65歳~" : `${r.ageGroup}歳`}
          </p>
        ))}
      </div>
    </div>
  );
}
