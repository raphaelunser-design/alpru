import type { Metadata } from "next";
import { findMvpResortBySlug } from "@/lib/mvpResorts";
import { getAlpivoResortBySlug } from "@/data/resorts";
import ResortDetailClient from "./ResortDetailClient";

type ResortPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ResortPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resort = getAlpivoResortBySlug(slug);
  const fallback = resort ? null : findMvpResortBySlug(slug);
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

export default async function ResortDetailPage({ params }: ResortPageProps) {
  const { slug } = await params;
  return <ResortDetailClient slug={slug} />;
}
