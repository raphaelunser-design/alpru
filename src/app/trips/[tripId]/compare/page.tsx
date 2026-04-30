import TripWorkspaceClient from "@/components/trips/TripWorkspaceClient";

export default async function TripComparePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <TripWorkspaceClient tripId={decodeURIComponent(tripId)} view="compare" />;
}

