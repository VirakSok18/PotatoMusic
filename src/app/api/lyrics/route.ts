import { NextRequest, NextResponse } from "next/server";
import type { LyricLine } from "@/lib/types";

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)/;

  for (const rawLine of lrc.split(/\r?\n/)) {
    const match = rawLine.match(regex);
    if (!match) continue;
    const mins = Number(match[1]);
    const secs = Number(match[2]);
    const msStr = match[3] || "0";
    const frac =
      msStr.length === 2
        ? Number(msStr) / 100
        : msStr.length === 3
        ? Number(msStr) / 1000
        : Number(msStr) / 10;
    const text = match[4].trim();
    if (!text) continue;
    lines.push({ time: mins * 60 + secs + frac, text });
  }

  return lines.sort((a, b) => a.time - b.time);
}

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title")?.trim() || "";
  const artist = req.nextUrl.searchParams.get("artist")?.trim() || "";
  const duration = req.nextUrl.searchParams.get("duration")?.trim() || "";

  if (!title) {
    return NextResponse.json({ synced: [], plain: null });
  }

  try {
    const cleanTitle = title
      .replace(/\s*[\(\[]\s*(official|lyric|audio|music|hd|4k|remastered|live)[^\)\]]*[\)\]]/gi, "")
      .trim();
    const primaryArtist = artist.split(",")[0]?.trim() || artist;
    const params = new URLSearchParams({
      track_name: cleanTitle || title,
      artist_name: primaryArtist,
    });
    if (duration && Number(duration) > 0) {
      params.set("duration", String(Math.round(Number(duration))));
    }

    let res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      headers: { "User-Agent": "PotatoMusic/1.0" },
      next: { revalidate: 3600 },
    });

    let data: { syncedLyrics?: string; plainLyrics?: string } | null = null;
    if (res.ok) {
      data = await res.json();
    } else {
      // Fallback to search endpoint
      const searchRes = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(`${title} ${primaryArtist}`)}`,
        { headers: { "User-Agent": "PotatoMusic/1.0" } }
      );
      if (searchRes.ok) {
        const list = (await searchRes.json()) as Array<{
          syncedLyrics?: string;
          plainLyrics?: string;
        }>;
        data = list.find((item) => item.syncedLyrics) || list[0] || null;
      }
    }

    const synced = data?.syncedLyrics ? parseLrc(data.syncedLyrics) : [];
    const plain = data?.plainLyrics || null;
    return NextResponse.json({ synced, plain });
  } catch {
    return NextResponse.json({ synced: [], plain: null });
  }
}
