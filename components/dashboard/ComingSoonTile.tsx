import { Lock, LucideIcon } from "lucide-react";

interface ComingSoonTileProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export default function ComingSoonTile({ title, description, icon: Icon }: ComingSoonTileProps) {
  return (
    <div className="card-luxury p-6 relative overflow-hidden opacity-70">
      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={22} strokeWidth={1.8} className="text-gray-400" />
      </div>
      <h3 className="font-bold text-charcoal-700 mb-1.5">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
      <span className="absolute top-5 right-5 flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
        <Lock size={10} strokeWidth={2.2} />
        近日公開
      </span>
    </div>
  );
}
