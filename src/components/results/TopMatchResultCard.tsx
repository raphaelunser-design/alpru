import Link from "next/link";
import type { ReactNode } from "react";
import { Button, Card, MatchScoreRing, ResortImage } from "@/components/ui";
import { CarIcon, SnowIcon, WalletIcon } from "@/components/results/TopMatchesFilterBar";

export type TopMatchCardModel = {
  slug: string;
  name: string;
  location: string;
  image: string;
  score: number;
  priceLevel: string;
  priceNote: string;
  travelTime: string;
  travelLabel: string;
  snow: string;
  reasons: string[];
  detailHref: string;
  sortScore: number;
  sortPrice: number;
  sortDriveMinutes: number;
};

function LocationIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Zm0-9a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function StatItem({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-[var(--alpivo-border-subtle)] pr-4 md:border-r md:last:border-r-0">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--alpivo-radius-sm)] text-[var(--alpivo-deep-navy)]" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight text-[var(--alpivo-deep-navy)]">{value}</span>
        <span className="mt-1 block text-xs leading-tight text-[var(--alpivo-ink-muted)]">{label}</span>
      </span>
    </div>
  );
}

export default function TopMatchResultCard({ match, priority = false }: { match: TopMatchCardModel; priority?: boolean }) {
  return (
    <Card as="article" interactive className="overflow-hidden p-0">
      <div className="grid lg:grid-cols-[minmax(280px,0.42fr)_minmax(0,1fr)_190px]">
        <Link href={match.detailHref} className="block focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-[rgba(47,107,255,0.5)]" aria-label={`${match.name} Details ansehen`}>
          <ResortImage
            src={match.image}
            alt={`${match.name} Winterpanorama`}
            priority={priority}
            aspectClassName="aspect-[1.72/1] lg:aspect-auto lg:h-full lg:min-h-[236px]"
            containerClassName="rounded-b-none rounded-t-[var(--alpivo-radius-xl)] lg:rounded-l-[var(--alpivo-radius-xl)] lg:rounded-r-none"
            sizes="(min-width: 1024px) 36vw, 94vw"
          />
        </Link>

        <div className="px-5 py-5 md:px-7">
          <div className="flex items-start justify-between gap-4 lg:block">
            <div>
              <h2 className="alpivo-ui-heading text-3xl leading-tight md:text-4xl">{match.name}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--alpivo-ink-muted)]">
                <LocationIcon />
                <span>{match.location}</span>
              </p>
            </div>
            <div className="lg:hidden">
              <MatchScoreRing value={match.score} size="sm" />
            </div>
          </div>

          <div className="mt-5 grid gap-4 border-b border-[var(--alpivo-border-subtle)] pb-5 md:grid-cols-3">
            <StatItem icon={<WalletIcon />} value={match.priceLevel} label={match.priceNote} />
            <StatItem icon={<CarIcon />} value={match.travelTime} label={match.travelLabel} />
            <StatItem icon={<SnowIcon />} value={match.snow} label="Schneesicherheit" />
          </div>

          <ul className="mt-5 space-y-2">
            {match.reasons.slice(0, 3).map((reason) => (
              <li key={reason} className="flex items-start gap-3 text-sm leading-6 text-[var(--alpivo-ink-muted)]">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[rgba(47,107,255,0.12)] text-[var(--alpivo-alpine-blue)]">
                  <CheckIcon />
                </span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-between gap-5 border-t border-[var(--alpivo-border-subtle)] px-5 py-5 lg:items-center lg:border-l lg:border-t-0 lg:px-6">
          <div className="hidden lg:block">
            <MatchScoreRing value={match.score} size="md" />
          </div>
          <Button href={match.detailHref} iconAfter={<ArrowIcon />} className="w-full">
            Details ansehen
          </Button>
        </div>
      </div>
    </Card>
  );
}
