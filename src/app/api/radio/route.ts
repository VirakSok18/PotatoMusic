import { NextRequest, NextResponse } from "next/server";
import { getRadioTracks } from "@/lib/ytmusic";

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("videoId")?.trim() || "";
  const artist = req.nextUrl.searchParams.get("artist")?.trim() || undefined;
  if (!videoId) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const tracks = await getRadioTracks(videoId, artist);
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json({ tracks: [] });
  }
}
