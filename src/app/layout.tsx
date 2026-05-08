import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import FeedbackButton from "@/components/FeedbackButton";
import Logo from "@/components/Logo";
import MobileBottomNav from "@/components/MobileBottomNav";
import PageAnalyticsTracker from "@/components/PageAnalyticsTracker";
import PageTransition from "@/components/PageTransition";
import SiteHeader from "@/components/SiteHeader";
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
        <SiteHeader />

        <main className="w-full overflow-hidden">
          <PageTransition>{children}</PageTransition>
        </main>
        <PageAnalyticsTracker />
        <FeedbackButton />
        <MobileBottomNav />

        <footer className="border-t border-white/10 bg-slate-950/80">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 text-xs text-slate-300 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
              <Logo />
              <span>{brand.name}: MVP, Daten teils geschätzt, Ergebnisse dienen als Orientierung.</span>
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Rechtliches">
              <Link className="hover:text-white" href="/impressum">Impressum</Link>
              <Link className="hover:text-white" href="/datenschutz">Datenschutz</Link>
              <Link className="hover:text-white" href="/datenhinweis">Datenhinweis</Link>
              <Link className="hover:text-white" href="/feedback">Kontakt/Feedback</Link>
              <Link className="hover:text-white" href="/quiz">Match starten</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
