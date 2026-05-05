"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import BackgroundHero from "@/components/BackgroundHero";
import GlassCard from "@/components/GlassCard";
import Section from "@/components/Section";
import SelectControl from "@/components/SelectControl";
import TripsStateCard from "@/components/trips/TripsStateCard";
import { alpivoDayPickerClassNames, alpivoDayPickerLocale } from "@/lib/alpivoDayPicker";
import { supabase } from "@/lib/supabase";
import { toIsoDate, tripFocusOptions, type SkiTripFocus, type SkiTripLevel } from "@/lib/tripPlanner";

type ResortCandidate = {
  slug: string;
  name: string;
  country: string;
  region: string | null;
  piste_km_total: number | null;
  piste_km: number | null;
  skipass_price_from: number | null;
  apres_score: number | null;
  beginner_score: number | null;
  elevation_max_m: number | null;
};

const levelOptions = [
  { value: "beginner", label: "Anfänger" },
  { value: "mixed", label: "Gemischt" },
  { value: "advanced", label: "Fortgeschritten" },
];

function deriveDisplayName(email: string | null | undefined) {
  if (!email) return "Trip Lead";
  return email.split("@")[0].replace(/[._-]+/g, " ") || "Trip Lead";
}

function getCandidatePisteKm(candidate: ResortCandidate) {
  return candidate.piste_km_total ?? candidate.piste_km ?? null;
}

function getCandidateTags(candidate: ResortCandidate) {
  const tags: string[] = [];
  const pisteKm = getCandidatePisteKm(candidate);

  if (typeof candidate.skipass_price_from === "number" && candidate.skipass_price_from <= 60) tags.push("günstig");
  if (typeof candidate.apres_score === "number" && candidate.apres_score >= 0.65) tags.push("Après-Ski");
  if (typeof candidate.beginner_score === "number" && candidate.beginner_score >= 0.68) tags.push("anfängerfreundlich");
  if (typeof candidate.elevation_max_m === "number" && candidate.elevation_max_m >= 2400) tags.push("schneesicher");
  if (typeof pisteKm === "number" && pisteKm >= 100) tags.push("großes Gebiet");
  if (!tags.length && candidate.country) tags.push(candidate.country);

  return tags.slice(0, 4);
}

function getCandidateReason(candidate: ResortCandidate) {
  const pisteKm = getCandidatePisteKm(candidate);
  if (typeof candidate.skipass_price_from === "number" && candidate.skipass_price_from <= 60) {
    return "Wirkt preislich attraktiv und ist damit ein guter Startpunkt für Gruppen mit Budget-Fokus.";
  }
  if (typeof pisteKm === "number" && pisteKm >= 100) {
    return "Bietet viel Pistenfläche und ist dadurch für gemischte Gruppen leichter planbar.";
  }
  if (typeof candidate.elevation_max_m === "number" && candidate.elevation_max_m >= 2400) {
    return "Hohe Lage spricht für bessere Schneesicherheit im gewählten Zeitraum.";
  }
  return "Passt als Alpivo-Favorit in den Vergleich und kann später mit Preisen und Verfügbarkeit bewertet werden.";
}

function getCandidateCaveat(candidate: ResortCandidate) {
  const pisteKm = getCandidatePisteKm(candidate);
  if (typeof candidate.skipass_price_from !== "number") return "Skipasspreise müssen noch geprüft werden.";
  if (candidate.skipass_price_from >= 85) return "Kann je nach Zeitraum teurer werden.";
  if (typeof pisteKm === "number" && pisteKm < 25) return "Eher kleines Gebiet, für lange Trips prüfen.";
  return "Anreise und Unterkunft später gegenchecken.";
}

export default function TripCreateClient() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [title, setTitle] = useState("Crew Ski Trip");
  const [description, setDescription] = useState("");
  const [startRegion, setStartRegion] = useState("");
  const [participantTarget, setParticipantTarget] = useState("4");
  const [budgetPerPerson, setBudgetPerPerson] = useState("520");
  const [skiLevel, setSkiLevel] = useState<SkiTripLevel>("mixed");
  const [focus, setFocus] = useState<SkiTripFocus[]>(["budget", "snow", "weekend"]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [dateLabel, setDateLabel] = useState("Favorisierter Zeitraum");
  const [dateNote, setDateNote] = useState("");
  const [resortCandidates, setResortCandidates] = useState<ResortCandidate[]>([]);
  const [selectedResorts, setSelectedResorts] = useState<string[]>([]);
  const [showMoreResorts, setShowMoreResorts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.user?.id ?? null);
      setUserEmail(data.user?.email ?? null);
    });

    supabase
      .from("resorts")
      .select("slug,name,country,region,piste_km_total,piste_km,skipass_price_from,apres_score,beginner_score,elevation_max_m")
      .order("piste_km_total", { ascending: false })
      .limit(24)
      .then(({ data }) => {
        if (!mounted) return;
        setResortCandidates((data ?? []) as ResortCandidate[]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedFocus = useMemo(() => new Set(focus), [focus]);
  const hasIncompleteDateRange = Boolean(dateRange && dateRange.from) && !(dateRange && dateRange.to);
  const topResortCandidates = resortCandidates.slice(0, 3);
  const moreResortCandidates = resortCandidates.slice(3);

  function toggleSelectedResort(slug: string) {
    setSelectedResorts((current) => (current.includes(slug) ? current.filter((entry) => entry !== slug) : [...current, slug]));
  }

  if (!userId) {
    return (
      <div className="space-y-8">
        <BackgroundHero imageSrc="/bg/banner-bild-4k.png" heightClass="min-h-[320px]" imagePosition="center 46%">
          <div className="mx-auto flex min-h-[280px] w-full max-w-6xl items-end px-4 pb-10 pt-12 md:px-6">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/70">Trips</p>
              <h1 className="mt-4 text-3xl font-semibold text-white md:text-5xl">Neuen Ski-Trip anlegen</h1>
            </div>
          </div>
        </BackgroundHero>
        <Section>
          <TripsStateCard
            title="Login erforderlich"
            text="Zum Anlegen eines echten Gruppen-Trips braucht Alpivo ein Konto. Danach werden Mitglieder, Resort-Favoriten und Kosten sauber an dein Profil gebunden."
            action={
              <Link
                href="/account"
                className="button-lift inline-flex rounded-lg bg-sky-200 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
              >
                Zu Konto / Login
              </Link>
            }
          />
        </Section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BackgroundHero imageSrc="/bg/banner-bild-4k.png" heightClass="min-h-[360px]" imagePosition="center 46%">
        <div className="mx-auto flex min-h-[320px] w-full max-w-6xl items-end px-4 pb-10 pt-12 md:px-6">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Trips</p>
            <h1 className="mt-4 text-3xl font-semibold text-white md:text-5xl">Neuen Ski-Trip anlegen</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/78">
              Der Trip bleibt eng am bestehenden Alpivo-Datenmodell: Resorts kommen aus der Bibliothek, Zeiträume werden später in der Gruppenansicht verfeinert.
            </p>
          </div>
        </div>
      </BackgroundHero>

      <Section className="space-y-6">
        {error ? <TripsStateCard title="Trip konnte nicht erstellt werden" text={error} tone="error" /> : null}

        <div className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
          <GlassCard className="p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Trip-Setup</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Grunddaten für die Gruppe</h2>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                Titel
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-300 md:col-span-2">
                Beschreibung
                <textarea
                  className="min-h-[110px] rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Worum geht es bei diesem Trip, welche Stimmung und welcher Rahmen sind der Gruppe wichtig"
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-300">
                Startregion
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
                  value={startRegion}
                  onChange={(event) => setStartRegion(event.target.value)}
                  placeholder="z. B. München"
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-300">
                Zielgröße
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
                  type="number"
                  min={1}
                  value={participantTarget}
                  onChange={(event) => setParticipantTarget(event.target.value)}
                />
              </label>

              <label className="grid gap-2 text-sm text-slate-300">
                Budget pro Person
                <input
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
                  type="number"
                  min={0}
                  value={budgetPerPerson}
                  onChange={(event) => setBudgetPerPerson(event.target.value)}
                />
              </label>

              <div className="grid gap-2 text-sm text-slate-300">
                Ski-Level
                <SelectControl value={skiLevel} options={levelOptions} onChange={(value) => setSkiLevel(value as SkiTripLevel)} ariaLabel="Ski-Level" />
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-medium text-white">Fokus der Gruppe</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {tripFocusOptions.map((option) => {
                  const active = selectedFocus.has(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`rounded-full border px-3 py-2 text-xs transition ${
                        active
                          ? "border-sky-200/25 bg-sky-200/10 text-sky-50"
                          : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1]"
                      }`}
                      onClick={() =>
                        setFocus((current) =>
                          current.includes(option.value)
                            ? current.filter((entry) => entry !== option.value)
                            : [...current, option.value]
                        )
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">Bevorzugte Resorts aus Alpivo</div>
                  <p className="mt-1 text-xs text-slate-500">
                    Erst Top 3 auswählen, Details werden später in Verfügbarkeit, Kosten und Vergleich geschärft.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-300">
                  {selectedResorts.length} gewählt
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {topResortCandidates.map((candidate) => {
                  const active = selectedResorts.includes(candidate.slug);
                  return (
                    <button
                      key={candidate.slug}
                      type="button"
                      className={`rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-sky-200/35 bg-sky-200/10 shadow-[0_0_24px_rgba(125,211,252,0.12)]"
                          : "border-white/10 bg-white/[0.05] hover:bg-white/[0.08]"
                      }`}
                      onClick={() => toggleSelectedResort(candidate.slug)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-white">{candidate.name}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {[candidate.region, candidate.country].filter(Boolean).join(", ")}
                          </div>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] ${
                            active ? "border-sky-200/35 bg-sky-200/15 text-sky-50" : "border-white/10 bg-slate-950/30 text-slate-300"
                          }`}
                        >
                          {active ? "ausgew?hlt" : "hinzuf?gen"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-300">{getCandidateReason(candidate)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getCandidateTags(candidate).map((tag) => (
                          <span key={`${candidate.slug}-${tag}`} className="rounded-full border border-white/10 bg-slate-950/35 px-2.5 py-1 text-[11px] text-slate-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-amber-100/80">Dagegen: {getCandidateCaveat(candidate)}</div>
                    </button>
                  );
                })}
              </div>

              {moreResortCandidates.length ? (
                <div className="mt-4">
                  <button
                    type="button"
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
                    onClick={() => setShowMoreResorts((current) => !current)}
                  >
                    {showMoreResorts ? "Weitere Resorts ausblenden" : `Weitere passende Resorts anzeigen (${moreResortCandidates.length})`}
                  </button>

                  {showMoreResorts ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {moreResortCandidates.map((candidate) => {
                        const active = selectedResorts.includes(candidate.slug);
                        return (
                          <button
                            key={candidate.slug}
                            type="button"
                            className={`rounded-full border px-3 py-2 text-xs transition ${
                              active
                                ? "border-sky-200/25 bg-sky-200/10 text-sky-50"
                                : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1]"
                            }`}
                            onClick={() => toggleSelectedResort(candidate.slug)}
                          >
                            {candidate.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Gewünschter Reisezeitraum</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Start- und Enddatum festlegen</h2>
              <p className="mt-2 text-sm text-slate-400">
                Dieser Zeitraum ist der erste Vorschlag für die Gruppe. Verfügbarkeiten der Teilnehmer werden danach separat abgestimmt.
              </p>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-slate-950/40 p-3">
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

            <div className="mt-4 grid gap-3">
              <input
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
                value={dateLabel}
                onChange={(event) => setDateLabel(event.target.value)}
                placeholder="Label für das erste Fenster"
              />
              <textarea
                className="min-h-[88px] rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500"
                value={dateNote}
                onChange={(event) => setDateNote(event.target.value)}
                placeholder="Optional: z. B. passt wegen Ferien, günstige Preisphase, bessere Verfügbarkeit."
              />
              {dateRange && dateRange.from ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-300">
                  Ausgewählt: {toIsoDate(dateRange.from)}
                  {dateRange.to ? ` bis ${toIsoDate(dateRange.to)}` : " - bitte noch ein Enddatum w?hlen"}
                </div>
              ) : null}
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300">
              <div className="font-semibold text-white">Trip Lead</div>
              <div className="mt-1">{deriveDisplayName(userEmail)}</div>
              <div className="mt-1 text-xs text-slate-500">{userEmail}</div>
            </div>

            <button
              className="button-lift mt-6 w-full rounded-lg bg-sky-200 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-white disabled:opacity-60"
              disabled={submitting || !title.trim() || hasIncompleteDateRange}
              onClick={async () => {
                setSubmitting(true);
                setError("");

                if (hasIncompleteDateRange) {
                  setError("Bitte für den Reisezeitraum auch ein Enddatum wählen.");
                  setSubmitting(false);
                  return;
                }

                const {
                  data: { session },
                } = await supabase.auth.getSession();

                if (!session || !session.access_token) {
                  setError("Deine Sitzung ist abgelaufen. Bitte in Alpivo erneut einloggen.");
                  setSubmitting(false);
                  return;
                }

                const response = await fetch("/api/trips", {
                  method: "POST",
                  headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || null,
                    startRegion: startRegion.trim() || null,
                    participantTarget: Number(participantTarget) || null,
                    budgetPerPerson: Number(budgetPerPerson) || null,
                    skiLevel,
                    focus,
                    preferredResortSlugs: selectedResorts,
                    dateOption:
                      dateRange && dateRange.from && dateRange.to
                        ? {
                            label: dateLabel.trim() || "Erstes Zeitfenster",
                            startDate: toIsoDate(dateRange.from),
                            endDate: toIsoDate(dateRange.to),
                            note: dateNote.trim() || null,
                          }
                        : null,
                  }),
                });

                const result = (await response.json().catch(() => null)) as { error: string; tripId: string } | null;

                if (!response.ok || !result || !result.tripId) {
                  setError(result?.error ?? "Trip konnte nicht angelegt werden.");
                  setSubmitting(false);
                  return;
                }

                setSubmitting(false);
                router.push(`/trips/${encodeURIComponent(result.tripId)}`);
              }}
            >
              {submitting ? "Trip wird erstellt..." : "Trip anlegen"}
            </button>
          </GlassCard>
        </div>
      </Section>
    </div>
  );
}
