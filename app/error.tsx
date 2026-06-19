"use client";

import { useEffect } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
          <p className="text-[#C4788A] text-5xl font-bold">Error</p>
          <p className="text-white text-xl font-semibold">問題が発生しました</p>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
          予期しないエラーが発生しました。
          <br />
          再試行するか、ホームに戻ってください。
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white font-semibold text-sm"
            style={{
              background: "linear-gradient(135deg, #C4788A 0%, #A85E74 100%)",
              boxShadow: "0 8px 24px rgba(196,120,138,0.3)",
            }}
          >
            <RotateCcw size={15} strokeWidth={2} />
            再試行する
          </button>
          <a
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white/10 text-white font-semibold text-sm"
          >
            ホームに戻る
            <ArrowRight size={15} strokeWidth={2} />
          </a>
        </div>
      </div>
    </div>
  );
}
