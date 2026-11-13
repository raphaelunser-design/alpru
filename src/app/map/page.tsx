import { loadPublicResorts } from "@/lib/publicResortCatalog";
import ResortMap from "./ResortMap";

export const dynamic = "force-dynamic";

export default async function MapPage({ searchParams }: { searchParams: Promise<{ resort?: string }> }) {
  const [{ resort }, catalog] = await Promise.all([searchParams, loadPublicResorts()]);
  const locations = catalog.resorts.flatMap((row) => {
    if (row.lat == null || row.lon == null || !Number.isFinite(row.lat) || !Number.isFinite(row.lon)) return [];
    return [{
      slug: row.slug || row.id,
      name: row.name,
      region: row.region,
      country: row.country,
      lat: row.lat,
      lon: row.lon,
    }];
  });

  return <ResortMap locations={locations} initialSlug={resort} usingFallback={catalog.usingFallback} />;
}
