import TripInviteClient from "@/components/trips/TripInviteClient";

export default async function TripInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <TripInviteClient token={decodeURIComponent(token)} />;
}

