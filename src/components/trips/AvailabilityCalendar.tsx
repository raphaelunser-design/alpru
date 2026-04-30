"use client";

import { useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { alpivoDayPickerClassNames, alpivoDayPickerLocale } from "@/lib/alpivoDayPicker";
import { availabilityOptions, formatDateRange, toIsoDate, type SkiTripAvailabilityStatus, type SkiTripDateOptionRecord } from "@/lib/tripPlanner";

type AvailabilityCalendarProps = {
  dateOptions: SkiTripDateOptionRecord[];
  selectedByOptionId: Record<string, SkiTripAvailabilityStatus | undefined>;
  onSaveStatus: (dateOptionId: string, status: SkiTripAvailabilityStatus) => Promise<void> | void;
  onCreateDateOption: (payload: { label: string; startDate: string; endDate: string; note: string }) => Promise<void> | void;
  canCreateDateOption: boolean;
};

export default function AvailabilityCalendar({
  dateOptions,
  selectedByOptionId,
  onSaveStatus,
  onCreateDateOption,
  canCreateDateOption,
}: AvailabilityCalendarProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [busyDateOptionId, setBusyDateOptionId] = useState<string | null>(null);
  const [savingRange, setSavingRange] = useState(false);

  const nextLabel = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return "";
    return `${dateRange.from.toLocaleDateString("de-DE", { month: "short" })} ${dateRange.from.getDate()} - ${dateRange.to.getDate()}.`;
  }, [dateRange]);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Kalender</div>
            <h3 className="mt-2 text-lg font-semibold text-white">Mögliche Reisefenster markieren</h3>
          </div>
          {canCreateDateOption (
            <span className="rounded-full border border-sky-200/20 bg-sky-200/10 px-3 py-1 text-xs text-sky-50">editierbar</span>
          ) : (
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-slate-300">nur Status</span>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <DayPicker
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            locale={alpivoDayPickerLocale}
            navLayout="after"
            numberOfMonths={1}
            weekStartsOn={1}
            disabled={{ before: new Date() }}
            className="alpivo-calendar"
            classNames={alpivoDayPickerClassNames}
          />
        </div>

        {canCreateDateOption (
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              placeholder={nextLabel || "Label für das Zeitfenster"}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
            <textarea
              className="min-h-[84px] rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500"
              placeholder="Kurz notieren, warum dieser Zeitraum spannend ist."
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <button
              className="button-lift rounded-lg bg-sky-200 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
              disabled={!dateRange.from || !dateRange.to || savingRange}
              onClick={async () => {
                if (!dateRange.from || !dateRange.to) return;
                setSavingRange(true);
                await onCreateDateOption({
                  label: label.trim() || nextLabel || "Neues Fenster",
                  startDate: toIsoDate(dateRange.from),
                  endDate: toIsoDate(dateRange.to),
                  note: note.trim(),
                });
                setSavingRange(false);
                setLabel("");
                setNote("");
                setDateRange(undefined);
              }}
            >
              {savingRange "Speichert..." : "Zeitraum anlegen"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3">
        {dateOptions.map((dateOption) => {
          const currentStatus = selectedByOptionId[dateOption.id];
          return (
            <div key={dateOption.id} className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{dateOption.label}</div>
                  <div className="mt-1 text-sm text-slate-300">{formatDateRange(dateOption.startDate, dateOption.endDate)}</div>
                  {dateOption.note <div className="mt-1 text-xs text-slate-400">{dateOption.note}</div> : null}
                </div>
                <div className="rounded-full border border-white/10 bg-slate-950/55 px-3 py-1 text-xs text-white/80">
                  {currentStatus availabilityOptions.find((option) => option.value === currentStatus).label : "Status offen"}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {availabilityOptions.map((option) => {
                  const active = currentStatus === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`rounded-full border px-3 py-2 text-xs transition ${
                        active option.chipClass : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]"
                      }`}
                      disabled={busyDateOptionId === dateOption.id}
                      onClick={async () => {
                        setBusyDateOptionId(dateOption.id);
                        await onSaveStatus(dateOption.id, option.value);
                        setBusyDateOptionId(null);
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
