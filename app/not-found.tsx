import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-charcoal-950 flex flex-col items-center justify-center px-6 text-center">
      {/* Decorative glow */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #C4788A 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <span className="text-[#C4788A] text-xs font-medium tracking-[0.3em] uppercase">
          Salon Value Score
        </span>

        <div className="flex flex-col items-center gap-2">
          <p className="text-[#C4788A] text-7xl font-bold">404</p>
          <p className="text-white text-xl font-semibold">ページが見つかりません</p>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
          お探しのページは移動または削除された可能性があります。
        </p>

        <Link href="/">
          <button
            className="mt-2 flex items-center gap-2 px-6 py-3.5 rounded-2xl text-white font-semibold text-sm"
            style={{
              background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)",
              boxShadow: "0 8px 24px rgba(196,120,138,0.3)",
            }}
          >
            ホームに戻る
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </Link>
      </div>
    </div>
  );
}
