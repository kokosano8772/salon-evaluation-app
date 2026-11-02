import { Sparkles } from "lucide-react";
import { Template } from "./types";

interface PresetButtonsProps {
  templates: Template[];
  onApply: (template: Template) => void;
}

// プリセット適用は「現在の選択への追加」。選択をリセットしてしまうと、複数の
// プリセットを組み合わせたり、適用後に個別調整したりする使い方ができなくなるため。
export default function PresetButtons({ templates, onApply }: PresetButtonsProps) {
  if (templates.length === 0) return null;

  return (
    <div className="card-luxury p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Sparkles size={13} strokeWidth={2} style={{ color: "#C4788A" }} />
        よく使う組み合わせ（プリセット）
      </p>
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onApply(t)}
            title={t.description || undefined}
            className="text-xs font-medium px-3.5 py-2 rounded-full border border-[#C4788A55] text-[#A85E74] bg-[#C4788A0D] hover:bg-[#C4788A1A] transition-colors"
          >
            {t.name}（{t.items.length}項目）
          </button>
        ))}
      </div>
    </div>
  );
}
