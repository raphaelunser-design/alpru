import { de } from "react-day-picker/locale";

export const alpivoDayPickerLocale = de;

export const alpivoDayPickerClassNames = {
  root: "alpivo-calendar-root",
  months: "grid gap-5 lg:grid-cols-2",
  month: "min-w-0 space-y-3",
  month_caption: "flex min-h-10 items-center justify-center px-2 text-center",
  caption_label: "text-sm font-semibold text-white",
  nav: "flex items-center justify-end gap-2",
  button_previous:
    "grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-slate-200 transition hover:bg-white/10 disabled:opacity-35",
  button_next:
    "grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-slate-200 transition hover:bg-white/10 disabled:opacity-35",
  month_grid: "w-full table-fixed border-collapse",
  weekdays: "text-center",
  weekday: "pb-2 text-[11px] font-medium uppercase text-slate-500",
  week: "text-center",
  day: "alpivo-day-cell",
  day_button: "alpivo-day-button",
  outside: "opacity-35",
  disabled: "pointer-events-none opacity-25",
  today: "alpivo-day-today",
  selected: "alpivo-day-selected",
  range_start: "alpivo-range-start",
  range_end: "alpivo-range-end",
  range_middle: "alpivo-range-middle",
} as const;
