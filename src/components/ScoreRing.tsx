"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useId, useRef } from "react";

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
  const config = sizeMap[size];
  const circumference = 2 * Math.PI * config.radius;
  const safeValue = Math.max(0, Math.min(100, value));
  const startValue = reduceMotion || safeValue === 0 ? safeValue : Math.max(1, Math.round(safeValue * 0.72));
  const current = useMotionValue(startValue);
  const rounded = useTransform(current, (latest) => Math.round(latest));
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const gradientId = useId().replace(/:/g, "");

  useEffect(() => {
    if (reduceMotion) {
      current.set(safeValue);
      return;
    }
    if (!inView) return;

    const controls = animate(current, safeValue, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [current, inView, reduceMotion, safeValue]);

  const dashOffset = useTransform(current, (latest) => circumference * (1 - Math.max(0, Math.min(100, latest)) / 100));

  return (
    <div ref={ref} className={`relative grid ${config.box} shrink-0 place-items-center ${className}`}>
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r={config.radius} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth={config.stroke} />
        <motion.circle
          cx="64"
          cy="64"
          r={config.radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeLinecap="round"
          strokeWidth={config.stroke}
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
        <defs>
          <linearGradient id={gradientId} x1="20" y1="20" x2="108" y2="108" gradientUnits="userSpaceOnUse">
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
