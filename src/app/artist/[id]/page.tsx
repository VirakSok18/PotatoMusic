import { notFound } from "next/navigation";
import { ArtistClient } from "@/components/ArtistClient";
import { getArtistDetail } from "@/lib/ytmusic";

export const revalidate = 900;

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artist = await getArtistDetail(decodeURIComponent(id));
  if (!artist) notFound();
  return <ArtistClient artist={artist} />;
}
