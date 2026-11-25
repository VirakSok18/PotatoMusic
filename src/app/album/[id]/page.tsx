import { notFound } from "next/navigation";
import { AlbumClient } from "@/components/AlbumClient";
import { getAlbumDetail } from "@/lib/ytmusic";

export const revalidate = 900;

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await getAlbumDetail(decodeURIComponent(id));
  if (!album) notFound();
  return <AlbumClient album={album} />;
}
