import Link from "next/link";

export default function PrivateAccessPage() {
  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-6 grid min-h-[calc(100vh-74px)] w-screen place-items-center overflow-hidden bg-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#08111f_0%,#0b1524_46%,#050a12_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-sky-200/10" />
      </div>

      <section className="relative z-10 w-full max-w-lg rounded-lg border border-white/14 bg-slate-950/78 p-6 shadow-[0_26px_80px_rgba(2,6,23,0.48)] backdrop-blur md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-100/75">Private Beta</p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-white">Alpivo ist noch nicht öffentlich.</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Diese Version ist vorerst nur für Personen mit Freigabe-Link oder Zugangscode sichtbar. Nach erfolgreicher
          Freischaltung merkt sich dieses Gerät den Zugriff.
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
            className="w-full rounded-lg border border-white/12 bg-white/[0.065] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-sky-200/45 focus:ring-2 focus:ring-sky-200/20"
            placeholder="Code eingeben"
          />
          <button
            type="submit"
            className="button-lift w-full rounded-lg bg-sky-200 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-white"
          >
            Alpivo öffnen
          </button>
        </form>

        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.055] p-3 text-xs leading-relaxed text-slate-400">
          Wenn du einen vollständigen Freigabe-Link erhalten hast, öffne diesen Link direkt. Der Code wird dann
          automatisch auf diesem Gerät gespeichert.
        </div>

        <Link href="/private-access" className="mt-5 inline-flex text-xs font-medium text-slate-400 hover:text-white">
          Zugang erneut prüfen
        </Link>
      </section>
    </div>
  );
}
