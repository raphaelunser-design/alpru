"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

type SelectControlProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  compact?: boolean;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="m5.5 7.5 4.5 4.5 4.5-4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function SelectControl({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
  compact = false,
}: SelectControlProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = useMemo(() => options.find((option) => option.value === value) ?? options[0], [options, value]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: MouseEvent) => {
      if (!rootRef.current || !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${open ? "z-[300]" : "z-0"} ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.065] text-left text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-sky-200/30 hover:bg-sky-200/[0.07] focus:outline-none focus:ring-2 focus:ring-sky-200/40 ${
          compact ? "px-3 py-2" : "px-4 py-3"
        }`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="min-w-0">
        <span className="block truncate font-medium">{selected.label ?? "Auswählen"}</span>
          {selected.description ? <span className="mt-0.5 block truncate text-xs text-slate-400">{selected.description}</span> : null}
        </span>
        <span className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-slate-950/40 text-slate-300">
          <ChevronIcon open={open} />
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-[310] mt-2 overflow-hidden rounded-lg border border-sky-200/20 bg-slate-950/96 shadow-[0_24px_70px_rgba(2,6,23,0.66)] backdrop-blur-xl">
          <div role="listbox" aria-label={ariaLabel} className="max-h-72 overflow-y-auto p-1.5">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
                    active
                      ? "border border-sky-200/25 bg-sky-200/[0.14] text-sky-50"
                      : "text-slate-200 hover:bg-sky-200/[0.08] hover:text-white"
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{option.label}</span>
                    {option.description ? (
                      <span className={`mt-0.5 block truncate text-xs ${active ? "text-slate-700" : "text-slate-500"}`}>
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {active ? <span className="text-xs font-semibold text-sky-100">Aktiv</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
