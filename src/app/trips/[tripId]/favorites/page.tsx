import TripWorkspaceClient from "@/components/trips/TripWorkspaceClient";

export default async function TripFavoritesPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <TripWorkspaceClient tripId={decodeURIComponent(tripId)} view="favorites" />;
}

