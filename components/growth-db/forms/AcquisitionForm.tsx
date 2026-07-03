import { ACQUISITION_CHANNELS } from "@/lib/growth-db/constants";
import { AcquisitionChannelMetrics } from "@/lib/growth-db/types";

interface AcquisitionFormProps {
  value: AcquisitionChannelMetrics[];
  onChange: (value: AcquisitionChannelMetrics[]) => void;
}

const COLS: { key: keyof AcquisitionChannelMetrics; label: string }[] = [
  { key: "inflow", label: "流入" },
  { key: "bookings", label: "予約" },
  { key: "visits", label: "来店" },
  { key: "cpa", label: "CPA" },
  { key: "cvr", label: "CVR(%)" },
];

export default function AcquisitionForm({ value, onChange }: AcquisitionFormProps) {
  const setCell = (channelId: string, key: keyof AcquisitionChannelMetrics, v: number) => {
    onChange(value.map((row) => (row.channel === channelId ? { ...row, [key]: v } : row)));
  };

  return (
    <div className="card-luxury p-6">
      <div className="mb-5">
        <h3 className="text-base font-bold text-charcoal-900">集客</h3>
        <p className="text-xs text-gray-400 mt-1">チャネルごとの流入〜来店・費用対効果</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-xs text-gray-400">
              <th className="py-2 pr-3 font-medium">チャネル</th>
              {COLS.map((c) => (
                <th key={c.key} className="py-2 px-2 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACQUISITION_CHANNELS.map(({ id, label }) => {
              const row = value.find((r) => r.channel === id);
              if (!row) return null;
              return (
                <tr key={id} className="border-t border-gray-50">
                  <td className="py-2 pr-3 font-medium text-charcoal-800 whitespace-nowrap">{label}</td>
                  {COLS.map((c) => (
                    <td key={c.key} className="py-2 px-2">
                      <input
                        type="number"
                        value={row[c.key] as number}
                        step={c.key === "cvr" ? 0.1 : 1}
                        onChange={(e) => setCell(id, c.key, Number(e.target.value))}
                        className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#C4788A] tabular-nums"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
