import { RecruitingMediumMetrics } from "@/lib/growth-db/types";

const COLS: { key: keyof RecruitingMediumMetrics; label: string }[] = [
  { key: "applications", label: "応募" },
  { key: "visits", label: "見学" },
  { key: "interviews", label: "面接" },
  { key: "hires", label: "採用" },
  { key: "applicationRate", label: "応募率(%)" },
  { key: "visitRate", label: "見学率(%)" },
  { key: "hireRate", label: "採用率(%)" },
  { key: "costPerHire", label: "採用単価" },
];

export default function RecruitingForm({
  value,
  onChange,
}: {
  value: RecruitingMediumMetrics[];
  onChange: (value: RecruitingMediumMetrics[]) => void;
}) {
  const setCell = (medium: string, key: keyof RecruitingMediumMetrics, v: number) => {
    onChange(value.map((row) => (row.medium === medium ? { ...row, [key]: v } : row)));
  };

  return (
    <div className="card-luxury p-6">
      <div className="mb-5">
        <h3 className="text-base font-bold text-charcoal-900">求人</h3>
        <p className="text-xs text-gray-400 mt-1">媒体ごとの応募〜採用実績</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs text-gray-400">
              <th className="py-2 pr-3 font-medium">媒体</th>
              {COLS.map((c) => (
                <th key={c.key} className="py-2 px-2 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.map((row) => (
              <tr key={row.medium} className="border-t border-gray-50">
                <td className="py-2 pr-3 font-medium text-charcoal-800 whitespace-nowrap">{row.medium}</td>
                {COLS.map((c) => (
                  <td key={c.key} className="py-2 px-2">
                    <input
                      type="number"
                      value={row[c.key] as number}
                      onChange={(e) => setCell(row.medium, c.key, Number(e.target.value))}
                      className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A] tabular-nums"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
