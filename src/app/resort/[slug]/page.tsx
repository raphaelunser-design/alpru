"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import DataStatusPanel from "@/components/premium/DataStatusPanel";
import ScoreRing from "@/components/ScoreRing";
import AppShell from "@/components/premium/AppShell";
import MetricChip from "@/components/premium/MetricChip";
import PageHeader from "@/components/premium/PageHeader";
import ResortActionHub from "@/components/premium/ResortActionHub";
import ResortMatchCard from "@/components/premium/ResortMatchCard";
import SkipassAssistant from "@/components/premium/SkipassAssistant";
import TrustPoint from "@/components/premium/TrustPoint";
import { getResortActionLinks } from "@/data/resortActionLinks";
import { getAlpivoResortBySlug, getAlpivoTopMatches, getCanonicalResortBySlug, toPremiumMatch } from "@/data/resorts";
import { useAlpivoGuestState } from "@/hooks/useAlpivoGuestState";

function CheckIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionCard({
  id,
  eyebrow,
  title,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-[2rem] border border-white/12 bg-slate-950/70 p-5 text-white shadow-[0_28px_90px_rgba(2,6,23,0.34)] md:p-7 ${className}`}>
      {eyebrow ? <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-200/76">{eyebrow}</p> : null}
      <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p> : null}
    </div>
  );
}

function FactorBar({ label, score, note }: { label: string; score: number; note: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-white">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">{note}</p>
        </div>
        <span className="rounded-full border border-emerald-200/22 bg-emerald-300/10 px-3 py-1 text-sm font-black text-emerald-100">{score}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300" style={{ width: `${Math.max(4, Math.min(100, score))}%` }} />
      </div>
    </div>
  );
}

function fitLabel(score: number | undefined) {
  if (typeof score !== "number") return "Daten fehlen";
  if (score >= 88) return "sehr stark";
  if (score >= 78) return "stark";
  if (score >= 66) return "solide";
  return "nur bedingt";
}

function fitScore(score: number | undefined) {
  return typeof score === "number" ? Math.max(0, Math.min(100, Math.round(score))) : 0;
}

export default function ResortDetailPage() {
  const params = useParams<{ slug?: string }>();
  const resort = useMemo(() => getAlpivoResortBySlug(params?.slug), [params?.slug]);
  const canonical = useMemo(() => getCanonicalResortBySlug(params?.slug), [params?.slug]);
  const { state: guestState, selectResort, toggleFavorite, addTripDraftResort, markActionCompleted } = useAlpivoGuestState();
  const [message, setMessage] = useState("");
  const favorite = resort ? guestState.favoriteResortSlugs.includes(resort.slug) : false;

  if (!resort) {
    return (
      <AppShell>
        <main className="alpivo-page-shell min-h-screen px-4 py-8 md:px-8">
          <section className="mx-auto flex min-h-[70vh] max-w-4xl items-center">
            <div className="w-full rounded-[2rem] border border-white/12 bg-slate-950/72 p-6 text-white shadow-[0_34px_100px_rgba(2,6,23,0.42)] md:p-10">
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-sky-200/80">Resort nicht gefunden</p>
              <h1 className="mt-4 text-4xl font-black">Dieses Skigebiet ist in der Beta noch nicht verfügbar.</h1>
              <p className="mt-4 max-w-2xl text-slate-300">
                Die Pilotdaten enthalten aktuell Obertauern, Sölden, Zell am See und Saalbach. Starte einen Match oder öffne die Resort-Übersicht.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white" href="/resorts">
                  Resorts ansehen
                </Link>
                <Link className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/14 px-5 text-sm font-extrabold text-white hover:bg-white/10" href="/quiz">
                  Match starten
                </Link>
              </div>
            </div>
          </section>
        </main>
      </AppShell>
    );
  }

  const related = getAlpivoTopMatches()
    .filter((item) => item.slug !== resort.slug)
    .slice(0, 3)
    .map(toPremiumMatch);
  const actionLinks = getResortActionLinks(resort.slug);
  const skipassLink = actionLinks.skipassShop ?? actionLinks.ticketInfo;
  const groupFits = [
    { label: "Freunde", score: Math.max(canonical?.vibe.apresFit ?? 0, canonical?.vibe.eventFit ?? 0, resort.score - 2), note: "Gemeinsame Abende, kurze Wege und Gruppenenergie." },
    { label: "Familie", score: canonical?.vibe.familyFit ?? canonical?.skiArea.beginnerFit ?? 68, note: "Orientierung aus Pistenprofil, Infrastruktur und Vibe." },
    { label: "Paar", score: canonical?.vibe.quietFit ?? (resort.vibeLabel.toLowerCase().includes("lebendig") ? 66 : 78), note: "Abhängig davon, ob Ruhe oder Abendprogramm wichtiger ist." },
    { label: "Sportgruppe", score: Math.max(canonical?.vibe.sportFit ?? 0, canonical?.skiArea.advancedFit ?? 0, resort.score - 4), note: "Pistenleistung, Höhenlage und Trainings-/Guiding-Fit." },
    { label: "Anfänger", score: canonical?.skiArea.beginnerFit ?? 72, note: "Breite Pisten und Skischul-/Verleih-Angebote als Orientierung." },
    { label: "Fortgeschrittene", score: canonical?.skiArea.intermediateFit ?? resort.score, note: "Pistenvielfalt und mittlere bis sportliche Abfahrten." },
    { label: "Après-Ski", score: canonical?.vibe.apresFit ?? canonical?.vibe.eventFit ?? 70, note: "Hütten, Events und lebendige Treffpunkte." },
    { label: "ruhiger Trip", score: canonical?.vibe.quietFit ?? (resort.vibeLabel.toLowerCase().includes("lebendig") ? 52 : 78), note: "Für sehr ruhige Trips vor Buchung Ortsteil und Unterkunftslage prüfen." },
  ];
  const resortSpecificCaveats: Record<string, string[]> = {
    obertauern: ["In der Hochsaison und an Wochenenden können Ort und beliebte Pisten voller werden.", "Für sehr ruhige Trips Unterkunftslage und Abendnähe bewusst wählen."],
    solden: ["Sölden ist sportlich und teils teurer, besonders rund um starke Termine.", "Für Einsteigergruppen kann das Gebiet ambitionierter wirken als kompakte Resorts."],
    "zell-am-see": ["Schnee je nach Lage, Höhe und Zeitraum stärker prüfen.", "Wer reinen Après-Fokus sucht, findet lebendigere Alternativen."],
    saalbach: ["Saalbach ist lebendig und nicht ideal für sehr ruhige Trips.", "An beliebten Wochenenden kann frühes Buchen entscheidend sein."],
  };
  const bookingChecklist = [
    "Skipasspreise offiziell prüfen",
    "Live-Schnee und Liftstatus prüfen",
    "Webcams vor Abfahrt ansehen",
    "Unterkunftsverfügbarkeit und Storno-/Umbuchungsbedingungen prüfen",
    "Anreise, Wetter und Wochenendverkehr prüfen",
    "Gruppenabstimmung finalisieren",
  ];
  const handleFavorite = () => {
    const isNowFavorite = toggleFavorite(resort.slug);
    setMessage(isNowFavorite ? "Favorit gespeichert. Das Cockpit kann diesen Resort jetzt aufgreifen." : "Favorit entfernt.");
  };

  const handleTripDraft = () => {
    addTripDraftResort(resort.slug);
    setMessage(`${resort.name} wurde deinem lokalen Trip-Entwurf hinzugefügt. Als Gast bleibt er auf diesem Gerät gespeichert.`);
  };

  return (
    <AppShell>
      <main className="alpivo-page-shell min-h-screen overflow-hidden px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[1480px] space-y-8">
          <PageHeader
            eyebrow="Resort Detail"
            title={resort.name}
            subtitle={`${resort.regionLabel}. Ein erklärbares Top-Match mit Score, Kosten, Anreise, Schnee, Vibe, Gründen und Haken.`}
            actions={
              <div className="flex flex-wrap gap-3">
                {skipassLink ? (
                  <a
                    href={skipassLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markActionCompleted("skipassChecked", resort.slug)}
                    className="button-lift inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400"
                  >
                    Skipass offiziell kaufen
                    <ArrowIcon />
                  </a>
                ) : null}
                <Link
                  href={`/map?resort=${encodeURIComponent(resort.slug)}`}
                  onClick={() => selectResort(resort.slug)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/[0.06] px-5 text-sm font-extrabold text-white hover:bg-white/10"
                >
                  Auf Karte ansehen
                  <ArrowIcon />
                </Link>
              </div>
            }
          />

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.24fr)_420px]">
            <article className="overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950/74 text-white shadow-[0_34px_110px_rgba(2,6,23,0.46)]">
              <div className="relative min-h-[430px] overflow-hidden">
                <Image
                  src={resort.image}
                  alt={`${resort.name} Alpenpanorama`}
                  fill
                  priority
                  sizes="(min-width: 1280px) 920px, 96vw"
                  className="object-cover"
                  style={{ objectPosition: "center 48%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/12 via-slate-950/26 to-slate-950/92" />
                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  {resort.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full border border-sky-200/24 bg-slate-950/48 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-sky-50 backdrop-blur">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-sky-100/88">{resort.regionLabel}</p>
                      <h2 className="mt-2 text-5xl font-black leading-none md:text-7xl">{resort.name}</h2>
                      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">{resort.description}</p>
                    </div>
                    <ScoreRing value={resort.score} size="lg" label="Match" />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricChip icon="cost" value={resort.priceLabel} label="pro Person" variant="glass" />
                <MetricChip icon="time" value={resort.travelTimeFromMunich} label="ab München" variant="glass" />
                <MetricChip icon="snow" value={resort.snowLabel} label="Schneesicherheit" variant="glass" />
                <MetricChip icon="vibe" value={resort.vibeLabel} label="Vibe & Events" variant="glass" />
                <MetricChip icon="piste" value={resort.pisteKm} label="Pistenkilometer" variant="glass" />
                <MetricChip icon="height" value={resort.altitude} label="Höhenlage" variant="glass" className="sm:col-span-2 lg:col-span-2" />
              </div>

              <div className="grid gap-5 border-t border-white/10 p-5 md:grid-cols-[1fr_0.75fr] md:p-7">
                <div className="rounded-3xl border border-emerald-200/16 bg-emerald-300/[0.075] p-5">
                  <h3 className="text-lg font-black text-white">3 Gründe, warum es passt</h3>
                  <ul className="mt-4 space-y-3">
                    {resort.reasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-3 text-sm leading-6 text-emerald-50">
                        <span className="mt-0.5 text-emerald-300">
                          <CheckIcon />
                        </span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl border border-amber-200/22 bg-amber-300/[0.08] p-5">
                  <h3 className="text-lg font-black text-amber-100">Ein möglicher Nachteil</h3>
                  <p className="mt-4 text-sm leading-7 text-amber-50/90">{resort.drawback}</p>
                </div>
              </div>
            </article>

            <aside className="space-y-5">
              <div className="rounded-[2rem] border border-white/12 bg-slate-950/78 p-5 shadow-[0_30px_90px_rgba(2,6,23,0.42)]">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-200/80">Nächster Schritt</p>
                <h2 className="mt-3 text-2xl font-black text-white">Match in Planung überführen</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Als Gast speichert Alpivo Favoriten und Trip-Entwürfe lokal auf diesem Gerät. Mit Login können diese Zustände später dauerhaft am Konto hängen.
                </p>
                <div className="mt-5 grid gap-3">
                  <button
                    type="button"
                    onClick={handleTripDraft}
                    className="button-lift inline-flex min-h-12 items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_42px_rgba(14,165,233,0.28)] hover:bg-sky-400"
                  >
                    Zum Trip hinzufügen
                  </button>
                  <button
                    type="button"
                    onClick={handleFavorite}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/14 bg-white/[0.06] px-5 text-sm font-extrabold text-white hover:bg-white/10"
                  >
                    {favorite ? "Favorit entfernen" : "Favorit speichern"}
                  </button>
                  <Link
                    href={`/map?resort=${encodeURIComponent(resort.slug)}`}
                    onClick={() => selectResort(resort.slug)}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-sky-200/20 bg-sky-300/[0.08] px-5 text-sm font-extrabold text-sky-50 hover:bg-sky-300/[0.13]"
                  >
                    Auf Karte ansehen
                  </Link>
                </div>
                {message ? <p className="mt-4 rounded-2xl border border-emerald-200/18 bg-emerald-300/[0.08] px-4 py-3 text-sm text-emerald-50">{message}</p> : null}
              </div>

              <ResortActionHub
                resortSlug={resort.slug}
                variant="compact"
                limit={4}
                title="Offiziell weiterplanen"
                subtitle="Direkt zu Skipass, Live-Status, Unterkunft und offiziellen Resort-Infos."
                onActionClick={(link) => {
                  if (link.kind === "skipass_shop" || link.kind === "ticket_info") markActionCompleted("skipassChecked", resort.slug);
                  if (link.kind === "live_status" || link.kind === "webcam") markActionCompleted("liveStatusChecked", resort.slug);
                  if (link.kind === "accommodation") markActionCompleted("accommodationChecked", resort.slug);
                  if (link.kind === "travel") markActionCompleted("routeChecked", resort.slug);
                }}
              />

              <div className="grid gap-3">
                <TrustPoint icon="shield" title="Unabhängig erklärt" text="Alpivo zeigt Gründe und Haken statt leere Rankings." />
                <TrustPoint icon="data" title="Beta-Daten klar markiert" text="Kosten und Resortdaten sind Orientierung und werden laufend verbessert." />
                <TrustPoint icon="lock" title="Lokal gespeichert" text="Favoriten und Trip-Entwurf bleiben im Gastmodus auf diesem Gerät." />
              </div>
            </aside>
          </section>

          <nav className="flex gap-2 overflow-x-auto rounded-[1.5rem] border border-white/10 bg-slate-950/58 p-2 text-sm font-extrabold text-slate-200 [scrollbar-width:none]">
            {[
              ["Match", "#match"],
              ["Aktionen", "#aktionen"],
              ["Skipass", "#skipass"],
              ["Fakten", "#fakten"],
              ["Wetter", "#wetter"],
              ["Kosten", "#kosten"],
              ["Anreise", "#anreise"],
              ["Vibe", "#vibe"],
              ["Gruppenfit", "#gruppenfit"],
              ["Buchungscheck", "#buchungscheck"],
              ["Kurse", "#services"],
              ["Links", "#links"],
              ["Datenstatus", "#datenstatus"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a key={href} href={href} className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-2.5 hover:border-sky-200/28 hover:bg-sky-300/10 hover:text-white">
                {label}
              </a>
            ))}
          </nav>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-6">
              <SectionCard id="aktionen" eyebrow="Direkt handeln" title="Aus dem Match in die Planung">
                <ResortActionHub
                  resortSlug={resort.slug}
                  title="Offizielle Actions für diesen Resort"
                  subtitle="Alle externen Links öffnen offizielle Seiten. Alpivo wickelt keine Buchung und keinen Skipasskauf ab."
                  onActionClick={(link) => {
                    if (link.kind === "skipass_shop" || link.kind === "ticket_info") markActionCompleted("skipassChecked", resort.slug);
                    if (link.kind === "live_status" || link.kind === "webcam") markActionCompleted("liveStatusChecked", resort.slug);
                    if (link.kind === "accommodation") markActionCompleted("accommodationChecked", resort.slug);
                    if (link.kind === "travel") markActionCompleted("routeChecked", resort.slug);
                  }}
                />
              </SectionCard>

              <SectionCard id="skipass" eyebrow="Ticket-Planung" title="Welcher Skipass ist plausibel?">
                <SkipassAssistant
                  resort={resort}
                  preferences={guestState.preferences}
                  groupSize={guestState.tripDraft?.groupSize ?? guestState.preferences.peopleCount}
                  completed={guestState.completedActions.skipassChecked}
                  onComplete={() => markActionCompleted("skipassChecked", resort.slug)}
                />
              </SectionCard>

              <SectionCard id="match" eyebrow="Match-Erklärung" title="Warum Alpivo dieses Resort empfiehlt">
                <div className="grid gap-4 lg:grid-cols-2">
                  {resort.detail.factorScores.map((factor) => (
                    <FactorBar key={factor.label} {...factor} />
                  ))}
                </div>
                <div className="mt-5 rounded-3xl border border-sky-200/16 bg-sky-300/[0.075] p-5">
                  <p className="text-sm font-black text-sky-50">Nicht nur sortiert. Erklärt.</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Der Score verbindet Budget, Anreise, Schnee, Pisten, Vibe und Planbarkeit. Genau deshalb bleibt der mögliche Haken sichtbar,
                    statt die Empfehlung wie ein reines Ranking wirken zu lassen.
                  </p>
                </div>
              </SectionCard>

              <SectionCard id="fakten" eyebrow="Skigebiet" title="Fakten auf einen Blick">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {resort.detail.facts.map((fact) => (
                    <InfoTile key={fact.label} {...fact} />
                  ))}
                </div>
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">Pistenprofil</p>
                      <p className="mt-1 text-sm text-slate-400">{resort.pisteKm} Pisten, {resort.detail.lifts}, Saison {resort.detail.seasonLabel}</p>
                    </div>
                    <span className="rounded-full border border-white/12 bg-white/[0.07] px-3 py-1.5 text-xs font-bold text-slate-200">{resort.altitude}</span>
                  </div>
                  <div className="mt-5 space-y-3">
                    {resort.detail.slopeDifficulty.map((slope) => (
                      <div key={slope.label}>
                        <div className="mb-1 flex justify-between text-xs font-bold text-slate-300">
                          <span>{slope.label}</span>
                          <span>{slope.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-300" style={{ width: `${slope.width}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              <SectionCard id="wetter" eyebrow="Wetter & Schnee" title={resort.detail.weather.headline}>
                <p className="max-w-4xl text-sm leading-7 text-slate-300">{resort.detail.weather.summary}</p>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {resort.detail.weather.metrics.map((metric) => (
                    <InfoTile key={metric.label} {...metric} />
                  ))}
                </div>
                <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
                  <div className="grid grid-cols-[0.8fr_1fr_0.8fr_0.8fr] bg-white/[0.06] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    <span>Tag</span>
                    <span>Signal</span>
                    <span>Temp.</span>
                    <span>Schnee</span>
                  </div>
                  {resort.detail.weather.forecast.map((day) => (
                    <div key={day.day} className="grid grid-cols-[0.8fr_1fr_0.8fr_0.8fr] gap-3 border-t border-white/10 px-4 py-3 text-sm text-slate-200">
                      <span className="font-bold text-white">{day.day}</span>
                      <span>{day.summary}</span>
                      <span>{day.temp}</span>
                      <span>{day.snow}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard id="kosten" eyebrow="Budget & Skipass" title="Kosten transparent einordnen">
                <div className="grid gap-4 md:grid-cols-2">
                  {resort.detail.costs.map((cost) => (
                    <InfoTile key={cost.label} {...cost} />
                  ))}
                </div>
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-white">Skipass-Orientierung</p>
                      <p className="mt-1 text-sm text-slate-400">Preise schwanken je nach Saison, Alter, Kaufkanal und Ticketdauer.</p>
                    </div>
                    <span className="rounded-full border border-amber-200/24 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-100">Beta-Daten</span>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {resort.detail.skipass.map((ticket) => (
                      <InfoTile key={ticket.label} {...ticket} />
                    ))}
                  </div>
                </div>
              </SectionCard>

              <SectionCard id="anreise" eyebrow="Anreise" title={`Von München nach ${resort.name}`}>
                <div className="grid gap-4 lg:grid-cols-3">
                  {resort.detail.travelOptions.map((option) => (
                    <div key={option.mode} className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-200/75">{option.mode}</p>
                      <p className="mt-2 text-2xl font-black text-white">{option.duration}</p>
                      <p className="mt-1 text-sm font-bold text-slate-200">{option.route}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-400">{option.note}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-3xl border border-sky-200/16 bg-sky-300/[0.075] p-5">
                  <div className="grid gap-4 md:grid-cols-4">
                    <InfoTile label="Start" value={resort.routeSummary.origin} />
                    <InfoTile label="Ziel" value={resort.routeSummary.destination} />
                    <InfoTile label="Strecke" value={resort.routeSummary.distance} />
                    <InfoTile label="Spritkosten" value={resort.routeSummary.fuelCost} />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{resort.routeSummary.note}</p>
                </div>
              </SectionCard>

              <SectionCard id="vibe" eyebrow="Vibe, Events & Unterkunft" title="Was der Trip vor Ort bedeutet">
                <div className="grid gap-4 md:grid-cols-3">
                  {resort.detail.vibeDetails.map((vibe) => (
                    <InfoTile key={vibe.label} {...vibe} />
                  ))}
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                    <h3 className="text-lg font-black text-white">Events & Abend</h3>
                    <ul className="mt-4 space-y-3">
                      {resort.detail.eventHighlights.map((event) => (
                        <li key={event} className="flex gap-3 text-sm leading-6 text-slate-300">
                          <span className="mt-0.5 text-emerald-300"><CheckIcon /></span>
                          <span>{event}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                    <h3 className="text-lg font-black text-white">Unterkunfts-Fit</h3>
                    <div className="mt-4 space-y-3">
                      {resort.detail.stayOptions.map((stay) => (
                        <div key={stay.name} className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-bold text-white">{stay.name}</p>
                            <span className="text-xs font-black text-sky-100">{stay.price}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-400">{stay.type} · {stay.fit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard id="gruppenfit" eyebrow="Gruppen-Fit" title="Für wen dieses Resort besonders gut passt">
                <div className="grid gap-4 md:grid-cols-2">
                  {groupFits.map((fit) => (
                    <div key={fit.label} className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-white">{fit.label}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-400">{fit.note}</p>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${fitScore(fit.score) ? "border-emerald-200/20 bg-emerald-300/10 text-emerald-50" : "border-amber-200/20 bg-amber-300/10 text-amber-50"}`}>
                          {fitScore(fit.score) ? `${fitScore(fit.score)} · ${fitLabel(fit.score)}` : "Daten fehlen"}
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300" style={{ width: `${Math.max(6, fitScore(fit.score))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-2xl border border-amber-200/18 bg-amber-300/[0.08] px-4 py-3 text-sm leading-6 text-amber-50/90">
                  Gruppen-Fit ist in der Beta eine Orientierung aus zentralen Alpivo-Daten, Pistenprofil und Vibe-Signalen. Fehlende Live-Daten werden bewusst nicht als Fakt ausgegeben.
                </p>
              </SectionCard>

              <SectionCard id="buchungscheck" eyebrow="Ehrlicher Check" title="Was vor Buchung geprüft werden sollte">
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-3xl border border-amber-200/20 bg-amber-300/[0.08] p-5">
                    <h3 className="text-lg font-black text-amber-100">Wann passt dieses Resort nicht?</h3>
                    <ul className="mt-4 space-y-3">
                      {(resortSpecificCaveats[resort.slug] ?? [resort.drawback]).map((item) => (
                        <li key={item} className="text-sm leading-6 text-amber-50/90">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                    <h3 className="text-lg font-black text-white">Vor Buchung prüfen</h3>
                    <ul className="mt-4 space-y-3">
                      {bookingChecklist.map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-6 text-slate-300">
                          <span className="mt-0.5 text-emerald-300"><CheckIcon /></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </SectionCard>
            </div>

            <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
              <SectionCard id="services" eyebrow="Kurse & Services" title="Vor Ort planbar">
                <ul className="space-y-3">
                  {resort.detail.skiServices.map((service) => (
                    <li key={service} className="flex gap-3 text-sm leading-6 text-slate-300">
                      <span className="mt-0.5 text-emerald-300"><CheckIcon /></span>
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard id="links" eyebrow="Action Links" title="Offizielle Links">
                <ResortActionHub
                  resortSlug={resort.slug}
                  variant="compact"
                  title="Aus Alpivo heraus weiterhandeln"
                  subtitle="Alpivo erklärt den Match. Tickets, Live-Status, Unterkunft und Anreise prüfst du anschließend bei den offiziellen Quellen."
                  onActionClick={(link) => {
                    if (link.kind === "skipass_shop" || link.kind === "ticket_info") markActionCompleted("skipassChecked", resort.slug);
                    if (link.kind === "live_status" || link.kind === "webcam") markActionCompleted("liveStatusChecked", resort.slug);
                    if (link.kind === "accommodation") markActionCompleted("accommodationChecked", resort.slug);
                    if (link.kind === "travel") markActionCompleted("routeChecked", resort.slug);
                  }}
                />
              </SectionCard>

              <SectionCard id="datenstatus" eyebrow="Datenstatus" title="Was aktuell sicher ist">
                <DataStatusPanel resortSlug={resort.slug} />
                <div className="mt-5 grid gap-3">
                  {resort.detail.externalLinks.map((link) =>
                    link.href.startsWith("/") ? (
                      <Link
                        key={link.label}
                        href={link.href}
                        onClick={link.href.startsWith("/map") ? () => selectResort(resort.slug) : undefined}
                        className="inline-flex min-h-11 items-center justify-between rounded-2xl border border-white/12 bg-white/[0.055] px-4 text-sm font-bold text-slate-100 hover:bg-white/10"
                      >
                        {link.label}
                        <ArrowIcon />
                      </Link>
                    ) : (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center justify-between rounded-2xl border border-white/12 bg-white/[0.055] px-4 text-sm font-bold text-slate-100 hover:bg-white/10"
                      >
                        {link.label}
                        <ArrowIcon />
                      </a>
                    ),
                  )}
                </div>
              </SectionCard>

              <SectionCard id="faq" eyebrow="FAQ" title="Häufige Fragen">
                <div className="space-y-3">
                  {[
                    ["Für wen passt dieses Resort?", `${resort.name} passt besonders, wenn ${resort.reasons[0]?.toLowerCase() ?? "der Match-Fit"} wichtig ist und ihr Gründe sowie Haken bewusst abwägen wollt.`],
                    ["Was ist der größte Haken?", resort.drawback],
                    ["Wie früh sollte man Skipass und Unterkunft prüfen?", "Sobald Zeitraum und Gruppengröße feststehen. Bei Wochenenden, Ferien oder sehr beliebten Orten früher prüfen."],
                    ["Welche Kosten sind geschätzt?", "Budget, Unterkunft, Anreiseanteil und Skipass-Orientierung sind Beta-Schätzungen. Verbindliche Preise liegen bei offiziellen Quellen."],
                    ["Welche Links sind offiziell?", "Action-Links im Hub führen zu offiziellen Resort-, Ticket-, Live-, Webcam- oder Unterkunftsseiten und öffnen in einem neuen Tab."],
                    ["Was sollte vor Buchung final geprüft werden?", "Skipasspreise, Live-Schnee/Lifte, Unterkunftsverfügbarkeit, Wetter/Route, Storno-/Umbuchungsbedingungen und Gruppenabstimmung."],
                  ].map(([question, answer]) => (
                    <details key={question} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                      <summary className="cursor-pointer text-sm font-black text-white">{question}</summary>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{answer}</p>
                    </details>
                  ))}
                </div>
              </SectionCard>
            </aside>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-sky-200/80">Alternativen</p>
              <h2 className="mt-2 text-3xl font-black text-white">Weitere passende Resorts</h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {related.map((item) => (
                <ResortMatchCard key={item.slug} match={item} variant="compact" />
              ))}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
