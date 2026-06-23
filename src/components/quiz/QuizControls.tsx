"use client";

import type { TripStyle } from "@/lib/resortSignals";

export function SliderRow(props: { label: string; hint?: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-white">{props.label}</div>
          {props.hint ? <div className="mt-1 text-xs text-slate-400">{props.hint}</div> : null}
        </div>
        <div className="text-sm text-slate-300">{props.value}/5</div>
      </div>

      <input
        className="mt-3 w-full"
        type="range"
        min={0}
        max={5}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />

      <div className="mt-1 flex justify-between text-[11px] text-slate-300">
        <span>egal</span>
        <span>wichtig</span>
      </div>
    </div>
  );
}

export function ProfileIcon({ profile }: { profile: TripStyle }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  if (profile === "budget") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M4 8h16v10H4V8Zm3-3h10v3H7V5Zm3 8h.01M15 12h3m-3 3h3" />
      </svg>
    );
  }

  if (profile === "apres") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M7 5h10l-1 7a4 4 0 0 1-8 0L7 5Zm5 11v3m-4 0h8M5 5h14" />
      </svg>
    );
  }

  if (profile === "family") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M12 20s7-4 7-10V6l-7-3-7 3v4c0 6 7 10 7 10Zm-3-9h6m-6 3h4" />
      </svg>
    );
  }

  if (profile === "glacier" || profile === "offpiste") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="m3 19 7-13 3.2 5.8L16 8l5 11H3Zm7-13 1.6 6 2.5-.2" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path {...common} d="M12 3v18m6-15H9.5a3 3 0 0 0 0 6H14a3 3 0 0 1 0 6H6m11-8 3 3-3 3" />
    </svg>
  );
}
