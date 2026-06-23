import Image from "next/image";
import { AppHeader, Button } from "@/components/ui";
import FeaturedResortCards from "@/components/home/FeaturedResortCards";
import LandingBenefitRow from "@/components/home/LandingBenefitRow";
import LandingSearchBar from "@/components/home/LandingSearchBar";

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HomeHero() {
  return (
    <div className="alpivo-ui-root min-h-screen bg-[var(--alpivo-snow-white)] text-[var(--alpivo-deep-navy)]">
      <AppHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="relative min-h-[490px] overflow-hidden md:min-h-[540px] lg:min-h-[585px]">
            <Image
              src="/bg/banner-bild-4k.png"
              alt="Panorama eines verschneiten Skigebiets mit Gondeln"
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: "center 45%" }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,251,255,0.94)_0%,rgba(248,251,255,0.8)_32%,rgba(248,251,255,0.28)_64%,rgba(248,251,255,0.04)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,251,255,0.24)_0%,rgba(248,251,255,0.12)_56%,rgba(248,251,255,0.88)_100%)]" />

            <div className="relative z-10 mx-auto flex min-h-[490px] w-full max-w-[1480px] items-center px-[var(--alpivo-space-page-x)] pb-24 pt-12 md:min-h-[540px] lg:min-h-[585px] lg:pb-32">
              <div className="max-w-[720px]">
                <h1 className="alpivo-ui-heading max-w-[12ch] text-5xl leading-[1.02] md:text-6xl lg:text-7xl">
                  Finde den Ski-Trip, der wirklich zu dir passt.
                </h1>
                <p className="mt-6 max-w-[620px] text-lg leading-8 text-[var(--alpivo-ink)] md:text-xl">
                  Vergleiche Skigebiete nach Budget, Anreise, Schnee und Vibe - und finde dein perfektes Match.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button href="/quiz" size="lg" iconAfter={<ArrowIcon />}>
                    Match starten
                  </Button>
                  <Button href="#beispiel-match" size="lg" variant="ghost" iconAfter={<ArrowIcon />}>
                    Beispiel ansehen
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-20 mx-auto -mt-20 w-full max-w-[1480px] px-[var(--alpivo-space-page-x)] lg:-mt-16">
            <LandingSearchBar />
          </div>
        </section>

        <FeaturedResortCards />
        <LandingBenefitRow />
      </main>
    </div>
  );
}
