"use client";

import type { CSSProperties } from "react";

type MatchScoreRingProps = {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeConfig = {
  sm: { box: "h-20 w-20", radius: 32, stroke: 7, text: "text-2xl" },
  md: { box: "h-28 w-28", radius: 44, stroke: 8, text: "text-4xl" },
  lg: { box: "h-36 w-36", radius: 58, stroke: 9, text: "text-5xl" },
};

export default function MatchScoreRing({ value, label = "Match", size = "md", className = "" }: MatchScoreRingProps) {
  const config = sizeConfig[size];
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  const circumference = 2 * Math.PI * config.radius;
  const dashOffset = circumference * (1 - safeValue / 100);
  const style = {
    "--ring-offset": dashOffset,
    "--ring-length": circumference,
  } as CSSProperties;

  return (
    <div
      className={`relative grid ${config.box} shrink-0 place-items-center rounded-full bg-white text-[var(--alpivo-deep-navy)] shadow-[var(--alpivo-shadow-sm)] ring-1 ring-[var(--alpivo-border-subtle)] ${className}`}
      style={style}
      role="img"
      aria-label={`${safeValue} Prozent ${label}`}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
        <circle cx="64" cy="64" r={config.radius} fill="none" stroke="var(--alpivo-mist-gray)" strokeWidth={config.stroke} />
        <circle
          cx="64"
          cy="64"
          r={config.radius}
          fill="none"
          stroke="var(--alpivo-alpine-blue)"
          strokeLinecap="round"
          strokeWidth={config.stroke}
          strokeDasharray="var(--ring-length)"
          strokeDashoffset="var(--ring-offset)"
        />
      </svg>
      <div className="text-center">
        <div className={`${config.text} font-semibold leading-none`}>{safeValue}%</div>
        <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--alpivo-ink-muted)]">{label}</div>
      </div>
    </div>
  );
}
