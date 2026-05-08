"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";

type ScoreRingProps = {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: { box: "h-20 w-20", text: "text-2xl", stroke: 7, radius: 32 },
  md: { box: "h-28 w-28", text: "text-4xl", stroke: 8, radius: 44 },
  lg: { box: "h-36 w-36", text: "text-5xl", stroke: 9, radius: 58 },
};

export default function ScoreRing({ value, label = "Match Score", size = "md", className = "" }: ScoreRingProps) {
  const reduceMotion = useReducedMotion();
  const current = useMotionValue(reduceMotion ? value : 0);
  const rounded = useTransform(current, (latest) => Math.round(latest));
  const config = sizeMap[size];
  const circumference = 2 * Math.PI * config.radius;
  const safeValue = Math.max(0, Math.min(100, value));

  useEffect(() => {
    if (reduceMotion) {
      current.set(safeValue);
      return;
    }

    const controls = animate(current, safeValue, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [current, reduceMotion, safeValue]);

  const dashOffset = useTransform(current, (latest) => circumference * (1 - Math.max(0, Math.min(100, latest)) / 100));

  return (
    <div className={`relative grid ${config.box} shrink-0 place-items-center ${className}`}>
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r={config.radius} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth={config.stroke} />
        <motion.circle
          cx="64"
          cy="64"
          r={config.radius}
          fill="none"
          stroke="url(#alpivo-score-gradient)"
          strokeLinecap="round"
          strokeWidth={config.stroke}
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
        <defs>
          <linearGradient id="alpivo-score-gradient" x1="20" y1="20" x2="108" y2="108" gradientUnits="userSpaceOnUse">
            <stop stopColor="#BAE6FD" />
            <stop offset="0.55" stopColor="#67E8F9" />
            <stop offset="1" stopColor="#86EFAC" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <motion.div className={`${config.text} font-semibold leading-none text-white`}>{rounded}</motion.div>
        <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-100/78">{label}</div>
      </div>
    </div>
  );
}
