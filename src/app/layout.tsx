import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import FeedbackButton from "@/components/FeedbackButton";
import MobileBottomNav from "@/components/MobileBottomNav";
import PageAnalyticsTracker from "@/components/PageAnalyticsTracker";
import PageTransition from "@/components/PageTransition";
import SiteFooter from "@/components/SiteFooter";
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
      { url: brand.iconPath, type: "image/png", sizes: "any" },
    ],
    apple: [{ url: brand.iconPath, type: "image/png", sizes: "any" }],
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
        <SiteFooter />
      </body>
    </html>
  );
}
