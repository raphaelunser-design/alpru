import Link from "next/link";
import { Card, MatchScoreRing, ResortImage, SectionContainer } from "@/components/ui";
import { getAlpivoResortBySlug, type AlpivoResort } from "@/data/resorts";
import { findMvpResortBySlug } from "@/lib/mvpResorts";

type FeaturedResort = {
  slug: string;
  name: string;
  location: string;
  image: string;
  score: number;
  snow: string;
  lifts: string;
  drive: string;
};

function formatLifts(value: string | number | null | undefined) {
  if (typeof value === "number") return `${value} Lifte`;
  if (!value) return "Lifte offen";
  const match = value.match(/\d+/);
  return match ? `${match[0]} Lifte` : value;
}

function fromAlpivoResort(resort: AlpivoResort, score: number): FeaturedResort {
  return {
    slug: resort.slug,
    name: resort.name,
    location: resort.regionLabel,
    image: resort.image,
    score,
    snow: resort.snowLabel === "sehr gut" ? "Sehr hoch" : resort.snowLabel === "gut" ? "Hoch" : resort.snowLabel,
    lifts: formatLifts(resort.detail.lifts),
    drive: resort.travelTimeFromMunich,
  };
}

function buildFeaturedResorts(): FeaturedResort[] {
  const obertauern = getAlpivoResortBySlug("obertauern");
  const solden = getAlpivoResortBySlug("solden");
  const serfaus = findMvpResortBySlug("serfaus-fiss-ladis");

  return [
    obertauern
      ? fromAlpivoResort(obertauern, 96)
      : {
          slug: "obertauern",
          name: "Obertauern",
          location: "Salzburger Land, Österreich",
          image: "/bg/site-hero.jpg",
          score: 96,
          snow: "Sehr hoch",
          lifts: "26 Lifte",
          drive: "3:45 h",
        },
    solden
      ? fromAlpivoResort(solden, 92)
      : {
          slug: "solden",
          name: "Sölden",
          location: "Tirol, Österreich",
          image: "/images/ski.jpg",
          score: 92,
          snow: "Sehr hoch",
          lifts: "31 Lifte",
          drive: "3:30 h",
        },
    {
      slug: serfaus?.slug ?? "serfaus-fiss-ladis",
      name: serfaus?.name ?? "Serfaus-Fiss-Ladis",
      location: [serfaus?.region ?? "Tirol", serfaus?.country ?? "Österreich"].filter(Boolean).join(", "),
      image: serfaus?.hero_image_url || serfaus?.image_url || "/bg/resorts.jpg",
      score: 88,
      snow: "Hoch",
      lifts: formatLifts(serfaus?.lifts_count_total ?? 68),
      drive: "6 h 15 min",
    },
  ];
}

function LocationIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Zm0-9a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatIcon({ type }: { type: "snow" | "lift" | "car" }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths = {
    snow: <path {...common} d="M12 3v18M5 7l14 10M19 7 5 17M7 4l1 4-4-1M17 4l-1 4 4-1M7 20l1-4-4 1M17 20l-1-4 4 1" />,
    lift: <path {...common} d="M5 20h14M8 20l1-8h6l1 8M12 12V4m-4 4h8M6 4h12" />,
    car: <path {...common} d="M5 16h14M7 16l1.3-5h7.4L17 16M7 19h.01M17 19h.01M4 16v3h16v-3" />,
  };

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

export default function FeaturedResortCards() {
  const resorts = buildFeaturedResorts();

  return (
    <SectionContainer id="beispiel-match" className="bg-[var(--alpivo-snow-white)] pb-4 pt-8 md:pt-10">
      <div className="grid gap-6 lg:grid-cols-3">
        {resorts.map((resort, index) => (
          <Card key={resort.slug} as="article" interactive className="overflow-hidden p-0">
            <Link href={`/resort/${encodeURIComponent(resort.slug)}`} className="block focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(47,107,255,0.5)]">
              <div className="relative">
                <ResortImage
                  src={resort.image}
                  alt={`${resort.name} Winterpanorama`}
                  priority={index === 0}
                  aspectClassName="aspect-[1.7/1]"
                  containerClassName="rounded-b-none rounded-t-[var(--alpivo-radius-xl)]"
                  sizes="(min-width: 1024px) 31vw, 92vw"
                />
                <div className="absolute -bottom-12 right-5">
                  <MatchScoreRing value={resort.score} size="sm" />
                </div>
              </div>
              <div className="px-5 pb-5 pt-7">
                <h2 className="alpivo-ui-heading text-2xl leading-tight">{resort.name}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-[var(--alpivo-ink-muted)]">
                  <LocationIcon />
                  <span>{resort.location}</span>
                </p>
                <div className="mt-5 grid grid-cols-3 divide-x divide-[var(--alpivo-border-subtle)] border-t border-[var(--alpivo-border-subtle)] pt-4">
                  <div className="pr-3">
                    <span className="flex items-center gap-2 text-[var(--alpivo-alpine-blue)]">
                      <StatIcon type="snow" />
                      <strong className="text-sm text-[var(--alpivo-deep-navy)]">{resort.snow}</strong>
                    </span>
                    <span className="mt-1 block text-xs text-[var(--alpivo-ink-muted)]">Schneesicherheit</span>
                  </div>
                  <div className="px-3">
                    <span className="flex items-center gap-2 text-[var(--alpivo-deep-navy)]">
                      <StatIcon type="lift" />
                      <strong className="text-sm text-[var(--alpivo-deep-navy)]">{resort.lifts}</strong>
                    </span>
                    <span className="mt-1 block text-xs text-[var(--alpivo-ink-muted)]">Lifte</span>
                  </div>
                  <div className="pl-3">
                    <span className="flex items-center gap-2 text-[var(--alpivo-deep-navy)]">
                      <StatIcon type="car" />
                      <strong className="text-sm text-[var(--alpivo-deep-navy)]">{resort.drive}</strong>
                    </span>
                    <span className="mt-1 block text-xs text-[var(--alpivo-ink-muted)]">ab München</span>
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </SectionContainer>
  );
}
