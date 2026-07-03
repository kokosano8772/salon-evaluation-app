import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";

interface HubTileProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export default function HubTile({ href, title, description, icon: Icon, color }: HubTileProps) {
  return (
    <Link href={href} className="card-luxury p-6 block hover:shadow-lg transition-shadow relative overflow-hidden">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}14` }}
      >
        <Icon size={22} strokeWidth={1.8} color={color} />
      </div>
      <h3 className="font-bold text-charcoal-900 mb-1.5">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      <span className="absolute bottom-5 right-5 flex items-center gap-1 text-xs font-medium" style={{ color }}>
        開く <ArrowRight size={12} strokeWidth={2.2} />
      </span>
    </Link>
  );
}
