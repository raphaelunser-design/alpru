import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import AdminNavLink from "@/components/AdminNavLink";
import FeedbackButton from "@/components/FeedbackButton";
import GlobalSearch from "@/components/GlobalSearch";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LocaleText from "@/components/LocaleText";
import Logo from "@/components/Logo";
import MobileBottomNav from "@/components/MobileBottomNav";
import PageAnalyticsTracker from "@/components/PageAnalyticsTracker";
import PageTransition from "@/components/PageTransition";
import { brand } from "@/config/brand";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: brand.name,
  description: "Finde passende Alpen-Skigebiete für Budget, Stil und Match-Qualität",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "256x256" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "256x256" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${spaceGrotesk.variable} ${manrope.variable} min-h-screen overflow-x-hidden pb-20 text-slate-100 antialiased md:pb-0`}>
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#eef6ff_0%,#0d1b2e_34%,#06101e_100%)]" />
        </div>
        <header className="sticky top-0 z-50 border-b border-white/35 bg-white/94 shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
            <Logo />
            <nav className="nav-scroll ml-auto hidden min-w-0 items-center gap-1.5 overflow-x-auto text-sm font-medium text-slate-700 lg:flex">
              <Link className="nav-link border border-sky-200/70 bg-sky-100/80 text-slate-950 shadow-sm hover:bg-sky-200" href="/quiz">
                <LocaleText textKey="match" />
              </Link>
              <Link className="nav-link border border-slate-200 bg-white text-slate-900 hover:bg-slate-50" href="/trips">
                <LocaleText textKey="trip" />
              </Link>
              <div className="ml-1 hidden h-6 w-px bg-slate-200 md:block" />
              <Link className="nav-link text-slate-600" href="/results"><LocaleText textKey="results" /></Link>
              <Link className="nav-link text-slate-600" href="/map"><LocaleText textKey="map" /></Link>
              <Link className="nav-link text-slate-600" href="/resorts"><LocaleText textKey="resorts" /></Link>
              <Link className="nav-link text-slate-600" href="/checklist"><LocaleText textKey="checklist" /></Link>
              <Link className="nav-link text-slate-600" href="/account"><LocaleText textKey="account" /></Link>
              <AdminNavLink className="nav-link text-slate-600" />
            </nav>
            <GlobalSearch variant="compact" className="hidden lg:block" />
            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>
            <div className="ml-auto flex items-center gap-2 lg:hidden">
              <GlobalSearch variant="icon" />
              <LanguageSwitcher />
              <Link className="nav-link border border-sky-200/70 bg-sky-100/80 text-sm font-semibold text-slate-950" href="/quiz">
                <LocaleText textKey="mobileMatch" />
              </Link>
              <Link className="nav-link border border-slate-200 bg-white text-sm font-semibold text-slate-900" href="/account">
                <LocaleText textKey="account" />
              </Link>
            </div>
          </div>
        </header>

        <main className="w-full overflow-hidden py-4 md:py-6">
          <PageTransition>{children}</PageTransition>
        </main>
        <PageAnalyticsTracker />
        <FeedbackButton />
        <MobileBottomNav />

        <footer className="border-t border-white/10 bg-slate-950/80">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-slate-300 md:flex-row md:items-center md:justify-between md:px-6">
            <div>{brand.name}: MVP, Daten teils geschätzt, Ergebnisse dienen als Orientierung.</div>
            <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Rechtliches">
              <Link className="hover:text-white" href="/impressum">Impressum</Link>
              <Link className="hover:text-white" href="/datenschutz">Datenschutz</Link>
              <Link className="hover:text-white" href="/datenhinweis">Datenhinweis</Link>
              <Link className="hover:text-white" href="/feedback">Kontakt/Feedback</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
