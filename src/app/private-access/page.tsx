import Link from "next/link";

export default function PrivateAccessPage() {
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-6 grid min-h-[calc(100vh-74px)] w-screen place-items-center overflow-hidden bg-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#08111f_0%,#0b1524_46%,#050a12_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-sky-200/10" />
      </div>

      <section className="relative z-10 w-full max-w-2xl rounded-[1.75rem] border border-white/14 bg-slate-950/78 p-6 shadow-[0_26px_80px_rgba(2,6,23,0.48)] backdrop-blur md:p-8">
        <div className="inline-flex rounded-full border border-sky-200/25 bg-sky-200/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-sky-100">
          Private Beta
        </div>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl">
          Dieser Bereich ist in der Beta noch eingeschränkt verfügbar.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">
          Alpivo wird gerade mit echten Match-, Resort-, Wetter- und Kostenlogiken geschärft. Wenn du einen Zugangscode
          hast, kannst du die Beta direkt freischalten. Ansonsten kommst du jederzeit zum Match-Einstieg zurück.
        </p>

        <form action="/" method="get" className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-slate-200" htmlFor="access">
            Zugangscode
          </label>
          <input
            id="access"
            name="access"
            type="password"
            autoComplete="one-time-code"
            className="w-full rounded-xl border border-white/12 bg-white/[0.065] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/45 focus:ring-2 focus:ring-sky-200/20"
            placeholder="Code eingeben"
          />
          <button
            type="submit"
            className="button-lift w-full rounded-xl bg-sky-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white"
          >
            Beta-Zugang prüfen
          </button>
        </form>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/quiz"
            className="button-lift inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 hover:bg-sky-100"
          >
            Match starten
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-white hover:bg-white/10"
          >
            Startseite ansehen
          </Link>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.055] p-3 text-xs leading-relaxed text-slate-400">
          Wenn du einen vollständigen Freigabe-Link erhalten hast, öffne diesen Link direkt. Der Code wird dann
          automatisch auf diesem Gerät gespeichert.
        </div>
      </section>
    </div>
  );
}
