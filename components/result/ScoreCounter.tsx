"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Rank, RankInfo } from "@/lib/types";

interface ScoreCounterProps {
  score: number;
  rank: Rank;
  rankInfo: RankInfo;
}

export default function ScoreCounter({ score, rank, rankInfo }: ScoreCounterProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const duration = 1800;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference * (1 - displayScore / 100);

  return (
    <div className="flex flex-col items-center">
      {/* Circle score */}
      <div className="relative w-48 h-48">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#f0ede6"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="#C4788A"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.8, ease: "easeOut" }}
          />
        </svg>

        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-5xl font-bold"
            style={{
              color: "#C4788A",
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
          >
            {displayScore}
          </motion.span>
          <span className="text-gray-400 text-sm mt-0.5">/ 100点</span>
        </div>
      </div>

      {/* Rank badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="mt-5 flex flex-col items-center"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${rankInfo.color} 0%, ${rankInfo.color}cc 100%)`,
            boxShadow: `0 8px 24px ${rankInfo.color}50`,
          }}
        >
          {rank}
        </div>
        <p className="mt-2 font-semibold text-charcoal-900 text-base">
          {rankInfo.label}
        </p>
        <p className="text-gray-500 text-sm mt-1 text-center max-w-[200px]">
          {rankInfo.description}
        </p>
      </motion.div>
    </div>
  );
}
