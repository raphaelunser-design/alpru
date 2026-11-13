import type { Metadata } from "next";
import { cache } from "react";
import { loadPublicResortDetail } from "@/lib/publicResortCatalog";
import { getAlpivoResortBySlug } from "@/data/resorts";
import ResortDetailClient from "./ResortDetailClient";

type ResortPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ match?: string | string[] }>;
};

const loadDetail = cache(async (slug: string) => {
  if (getAlpivoResortBySlug(slug)) return null;
  return (await loadPublicResortDetail(slug)).resort;
});

export async function generateMetadata({ params }: ResortPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resort = getAlpivoResortBySlug(slug);
  const fallback = await loadDetail(slug);
  const name = resort?.name ?? fallback?.name;
  const region = resort?.regionLabel ?? [fallback?.region, fallback?.country].filter(Boolean).join(", ");
  const description =
    resort?.description ??
    (name
      ? `${name} im Alpivo Resort-Profil mit Key Facts, Match-Fit, Anreise, Pisten und nächsten Planungsschritten.`
      : "Alpivo Resort-Profil mit Key Facts, Match-Fit und Planungsschritten.");
  const image = resort?.image ?? fallback?.hero_image_url ?? fallback?.image_url ?? "/bg/skilandschaft.png";

  if (!name) {
    return {
      title: "Resort nicht gefunden | Alpivo",
      description: "Dieses Skigebiet ist in Alpivo noch nicht verfügbar.",
    };
  }

  return {
    title: `${name} Ski-Trip Match | Alpivo`,
    description,
    openGraph: {
      title: `${name} Ski-Trip Match | Alpivo`,
      description,
      images: [{ url: image, alt: `${name} Winterpanorama` }],
      locale: "de_DE",
      siteName: "Alpivo",
      type: "website",
    },
    alternates: {
      canonical: `/resort/${encodeURIComponent(slug)}`,
    },
    keywords: [name, "Skigebiet", "Skiurlaub", "Alpivo", region].filter((item): item is string => Boolean(item)),
  };
}

export default async function ResortDetailPage({ params, searchParams }: ResortPageProps) {
  const [{ slug }, { match }] = await Promise.all([params, searchParams]);
  return <ResortDetailClient slug={slug} detail={await loadDetail(slug)} matchId={typeof match === "string" ? match : undefined} />;
}
