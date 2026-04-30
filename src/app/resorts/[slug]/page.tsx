import { redirect } from "next/navigation";

export default async function ResortAliasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/resort/${encodeURIComponent(slug)}`);
}
