"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Circle, Copy, Edit2, Info, X } from "lucide-react";
import {
  ATTRACTION_FIELDS,
  RECRUITMENT_FIELDS,
  AnalysisMode,
  CellData,
  CellRating,
  ComparisonData,
  ComparisonField,
  SalonData,
} from "@/lib/competitor-research/types";

export interface CompetitorComparisonTableProps {
  salons: SalonData[];
  mode: AnalysisMode;
  cellData: ComparisonData;
  onCellChange: (salonId: string, fieldKey: string, data: Partial<CellData>) => void;
}

const RATINGS: { value: CellRating; label: string; dot: string; row: string }[] = [
  { value: "good", label: "良い", dot: "bg-green-500", row: "bg-green-50/70" },
  { value: "normal", label: "普通", dot: "bg-yellow-400", row: "bg-yellow-50/70" },
  { value: "bad", label: "悪い", dot: "bg-red-500", row: "bg-red-50/70" },
  { value: "neutral", label: "未評価", dot: "bg-gray-200", row: "" },
];

const ratingMap = Object.fromEntries(RATINGS.map((r) => [r.value, r]));

function cellRatingBg(rating: CellRating): string {
  return ratingMap[rating]?.row ?? "";
}

function getInitialValue(salon: SalonData, field: ComparisonField): string {
  const src = field.category === "attraction" ? salon.attraction : salon.recruitment;
  if (!src) return "";
  const raw = (src as Record<string, unknown>)[field.key];
  if (raw === undefined || raw === null) return "";
  if (Array.isArray(raw)) return raw.join("、");
  if (typeof raw === "boolean") return raw ? "あり" : "なし";
  if (typeof raw === "number") return raw === 0 ? "" : String(raw);
  return String(raw);
}

function CellEditor({
  initialValue,
  onSave,
  onCancel,
  placeholder,
}: {
  initialValue: string;
  onSave: (v: string) => void;
  onCancel: () => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSave(value);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  }

  return (
    <div className="relative min-w-[160px]">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "入力してください"}
        rows={3}
        className="w-full resize-none text-xs leading-relaxed bg-white border border-[#C4788A] rounded-lg px-2 py-1.5 text-charcoal-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C4788A]/30 shadow-lg"
      />
      <div className="flex items-center gap-1 mt-1 justify-end">
        <button
          onMouseDown={(e) => { e.preventDefault(); onCancel(); }}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 transition-colors"
          title="キャンセル (Esc)"
        >
          <X size={12} />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); onSave(value); }}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-[#C4788A] text-white hover:opacity-90 transition-opacity"
          title="保存 (Enter)"
        >
          <Check size={12} />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5">Enterで保存　Shift+Enterで改行　Escでキャンセル</p>
    </div>
  );
}

function RatingMenu({
  current,
  onChange,
  onClose,
}: {
  current: CellRating;
  onChange: (r: CellRating) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-6 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden min-w-[110px]">
      <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 border-b border-gray-100 uppercase tracking-wide">評価</p>
      {RATINGS.map((r) => (
        <button
          key={r.value}
          className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 ${
            current === r.value ? "font-semibold text-charcoal-900" : "text-gray-400"
          }`}
          onClick={() => { onChange(r.value); onClose(); }}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.dot}`} />
          {r.label}
          {current === r.value && <span className="ml-auto text-[#C4788A]">✓</span>}
        </button>
      ))}
    </div>
  );
}

function TableCell({
  cell,
  isOwn,
  field,
  onChange,
}: {
  cell: CellData;
  isOwn: boolean;
  field: ComparisonField;
  onChange: (data: Partial<CellData>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const rating = ratingMap[cell.rating] ?? ratingMap["neutral"];

  const bgClass = isOwn ? "bg-rose-50/50" : cellRatingBg(cell.rating);

  function handleCopy() {
    navigator.clipboard.writeText(cell.value).catch(() => {});
  }

  return (
    <td
      className={`relative border-r border-b border-gray-100 align-top min-w-[160px] max-w-[220px] text-xs ${bgClass} ${
        isOwn ? "border-l-2 border-l-[#C4788A]" : ""
      }`}
    >
      {!isOwn && cell.rating !== "neutral" && (
        <span className={`absolute top-2 left-1.5 w-1.5 h-1.5 rounded-full ${rating.dot}`} />
      )}

      <div className={`px-3 py-2 group min-h-[40px] ${!isOwn ? "pl-4" : ""}`}>
        {isOwn && editing ? (
          <CellEditor
            initialValue={cell.value}
            onSave={(v) => { onChange({ value: v }); setEditing(false); }}
            onCancel={() => setEditing(false)}
            placeholder={`${field.label}を入力…`}
          />
        ) : (
          <div className="flex items-start justify-between gap-1">
            <span className={`leading-relaxed whitespace-pre-wrap break-words flex-1 ${cell.value ? "text-charcoal-900" : "text-gray-400 italic text-[11px]"}`}>
              {cell.value || (isOwn ? "クリックして入力" : "—")}
            </span>

            <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {cell.value && (
                <button onClick={handleCopy} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-charcoal-900 hover:bg-gray-100 transition-colors" title="コピー">
                  <Copy size={10} />
                </button>
              )}
              {isOwn && (
                <button onClick={() => setEditing(true)} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-[#C4788A] hover:bg-rose-50 transition-colors" title="編集">
                  <Edit2 size={10} />
                </button>
              )}
              {!isOwn && (
                <div className="relative">
                  <button onClick={() => setShowMenu((v) => !v)} className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-charcoal-900 hover:bg-gray-100 transition-colors" title="評価を設定">
                    <Circle size={10} />
                  </button>
                  {showMenu && (
                    <RatingMenu current={cell.rating} onChange={(r) => onChange({ rating: r })} onClose={() => setShowMenu(false)} />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </td>
  );
}

function ScoreBar({ salonId, fields, data, isOwn }: { salonId: string; fields: ComparisonField[]; data: ComparisonData; isOwn: boolean }) {
  if (isOwn) return <div className="h-5" />;

  const ratings = fields
    .map((f) => data[salonId]?.[f.key]?.rating)
    .filter((r): r is CellRating => !!r && r !== "neutral");

  if (ratings.length === 0) {
    return <span className="text-[10px] text-gray-400">未評価</span>;
  }

  const good = ratings.filter((r) => r === "good").length;
  const normal = ratings.filter((r) => r === "normal").length;
  const bad = ratings.filter((r) => r === "bad").length;
  const total = ratings.length;

  return (
    <div className="space-y-1">
      <div className="flex rounded-full overflow-hidden h-1.5 w-full bg-gray-100">
        {good > 0 && <div className="bg-green-500" style={{ width: `${(good / total) * 100}%` }} />}
        {normal > 0 && <div className="bg-yellow-400" style={{ width: `${(normal / total) * 100}%` }} />}
        {bad > 0 && <div className="bg-red-500" style={{ width: `${(bad / total) * 100}%` }} />}
      </div>
      <div className="flex gap-2 text-[10px] text-gray-400">
        {good > 0 && <span className="text-green-600">良 {good}</span>}
        {normal > 0 && <span className="text-yellow-600">普 {normal}</span>}
        {bad > 0 && <span className="text-red-600">悪 {bad}</span>}
        <span className="ml-auto">{total}/{fields.length}</span>
      </div>
    </div>
  );
}

function TableSection({
  title,
  fields,
  salons,
  data,
  onChange,
}: {
  title: string;
  fields: ComparisonField[];
  salons: SalonData[];
  data: ComparisonData;
  onChange: (salonId: string, key: string, patch: Partial<CellData>) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <tr>
        <td colSpan={salons.length + 1} className="p-0 sticky left-0 z-10">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase border-y border-gray-100 transition-colors text-left bg-rose-50/60 text-[#A85E74] hover:bg-rose-50"
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            {title}
            <span className="font-normal normal-case opacity-70 ml-1">{fields.length} 項目</span>
            {!collapsed && (
              <span className="ml-auto flex items-center gap-1 font-normal normal-case opacity-60">
                <Info size={11} />
                競合列をホバーして評価を設定
              </span>
            )}
          </button>
        </td>
      </tr>

      {!collapsed &&
        fields.map((field, rowIdx) => (
          <tr key={field.key} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
            <td className="sticky left-0 z-10 border-r border-b border-gray-100 px-4 py-2.5 whitespace-nowrap bg-white">
              <span className="text-xs font-medium text-charcoal-900">{field.label}</span>
            </td>
            {salons.map((salon) => {
              const stored = data[salon.id]?.[field.key];
              const cell: CellData = stored ?? { value: getInitialValue(salon, field), rating: "neutral" };
              return (
                <TableCell
                  key={salon.id}
                  cell={cell}
                  isOwn={!!salon.isOwn}
                  field={field}
                  onChange={(patch) => onChange(salon.id, field.key, patch)}
                />
              );
            })}
          </tr>
        ))}
    </>
  );
}

export default function CompetitorComparisonTable({ salons, mode, cellData, onCellChange }: CompetitorComparisonTableProps) {
  const showAttraction = mode === "attraction" || mode === "both";
  const showRecruitment = mode === "recruitment" || mode === "both";

  const allFields = [
    ...(showAttraction ? ATTRACTION_FIELDS : []),
    ...(showRecruitment ? RECRUITMENT_FIELDS : []),
  ];

  return (
    <div className="card-luxury overflow-hidden">
      <div className="overflow-x-auto">
        <table className="border-collapse w-max min-w-full">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 border-r border-b border-gray-100 px-4 py-3 text-left min-w-[140px]">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">項目</span>
              </th>
              {salons.map((salon) => (
                <th
                  key={salon.id}
                  className={`border-r border-b border-gray-100 px-4 py-3 text-left min-w-[180px] align-top ${
                    salon.isOwn ? "bg-rose-50 border-l-2 border-l-[#C4788A]" : "bg-gray-50"
                  }`}
                >
                  <div className="space-y-0.5 mb-2">
                    {salon.isOwn && (
                      <span className="inline-flex px-1.5 py-0.5 text-[10px] bg-[#C4788A] text-white rounded font-bold mb-1">自社</span>
                    )}
                    <p className={`text-xs font-semibold leading-tight ${salon.isOwn ? "text-[#A85E74]" : "text-charcoal-900"}`}>{salon.name}</p>
                    {salon.area && <p className="text-[11px] text-gray-400">{salon.area}</p>}
                    {salon.rating > 0 && (
                      <p className="text-[11px] text-amber-500">★ {salon.rating.toFixed(1)} ({salon.reviewCount}件)</p>
                    )}
                  </div>
                  <ScoreBar salonId={salon.id} fields={allFields} data={cellData} isOwn={!!salon.isOwn} />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {showAttraction && (
              <TableSection title="集客分析" fields={ATTRACTION_FIELDS} salons={salons} data={cellData} onChange={onCellChange} />
            )}
            {showRecruitment && (
              <TableSection title="求人分析" fields={RECRUITMENT_FIELDS} salons={salons} data={cellData} onChange={onCellChange} />
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center gap-4 flex-wrap">
        <span className="text-[11px] text-gray-400 font-medium">評価凡例:</span>
        {RATINGS.filter((r) => r.value !== "neutral").map((r) => (
          <span key={r.value} className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className={`w-2 h-2 rounded-full ${r.dot}`} />
            {r.label}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-gray-400">自社列をクリックして情報を入力　競合列をホバーして評価を設定</span>
      </div>
    </div>
  );
}
