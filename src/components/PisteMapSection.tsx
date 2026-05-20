type PisteMapSectionProps = {
  resortName: string;
  pisteMapUrl?: string | null;
  openskimapUrl?: string | null;
  officialUrl?: string | null;
};

function isPdf(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.toLowerCase().includes(".pdf");
  }
}

function labelFor(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Quelle";
  }
}

function OfficialPistePdfViewer({ url, resortName }: { url: string; resortName: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/70">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-xs text-slate-300">
        <span>Offizieller Pistenplan · {labelFor(url)}</span>
        <a className="rounded-lg border border-white/15 px-3 py-1.5 text-white hover:bg-white/10" href={url} target="_blank" rel="noopener noreferrer">
          Vollbild
        </a>
      </div>
      <iframe
        className="h-[560px] w-full bg-white md:h-[680px]"
        src={url}
        title={`Pistenplan ${resortName}`}
        loading="lazy"
      />
    </div>
  );
}

function InteractiveSkiMap({ url, resortName }: { url: string; resortName: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/70">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-xs text-slate-300">
        <span>Interaktive Kartenansicht · {labelFor(url)}</span>
        <a className="rounded-lg border border-white/15 px-3 py-1.5 text-white hover:bg-white/10" href={url} target="_blank" rel="noopener noreferrer">
          Quelle öffnen
        </a>
      </div>
      <iframe
        className="h-[520px] w-full bg-slate-900 md:h-[640px]"
        src={url}
        title={`Interaktive Skikarte ${resortName}`}
        loading="lazy"
      />
    </div>
  );
}

function PisteMapFallback({ officialUrl }: { officialUrl?: string | null }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.06] p-6">
      <div className="text-sm font-semibold text-white">Pistenplan noch nicht eingebettet</div>
      <p className="mt-2 max-w-2xl text-sm text-slate-300">
        Für dieses Resort ist aktuell kein verlässlich einbettbarer Pistenplan hinterlegt. Die Komponente ist so gebaut,
        dass ein offizieller PDF-Plan oder eine offene Kartenquelle direkt hier angezeigt werden kann.
      </p>
      {officialUrl ? (
        <a className="mt-4 inline-flex rounded-lg border border-white/15 px-4 py-2 text-sm text-white hover:bg-white/10" href={officialUrl} target="_blank" rel="noopener noreferrer">
          Offizielle Seite prüfen
        </a>
      ) : null}
    </div>
  );
}

export default function PisteMapSection({ resortName, pisteMapUrl, openskimapUrl, officialUrl }: PisteMapSectionProps) {
  const officialMap = (pisteMapUrl || "").trim();
  const openMap = (openskimapUrl || "").trim();
  const canShowOfficialPdf = Boolean(officialMap && isPdf(officialMap));
  const mapToEmbed = canShowOfficialPdf ? officialMap : openMap || officialMap;

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/50 p-6 shadow-[0_18px_48px_rgba(2,6,23,0.28)]">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Pistenkarte</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Direkt im Resort-Profil</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Alpivo priorisiert offizielle PDF-Pläne. Wenn diese fehlen, wird eine offene Kartenquelle oder ein sauberer
            Fallback genutzt.
          </p>
        </div>
      </div>

      {canShowOfficialPdf ? (
        <OfficialPistePdfViewer url={officialMap} resortName={resortName} />
      ) : mapToEmbed ? (
        <InteractiveSkiMap url={mapToEmbed} resortName={resortName} />
      ) : (
        <PisteMapFallback officialUrl={officialUrl} />
      )}
    </section>
  );
}

