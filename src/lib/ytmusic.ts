import { EventEmitter } from "node:events";
import YTMusic from "ytmusic-api";
import type {
  AlbumDetail,
  AlbumSummary,
  ArtistDetail,
  ArtistSummary,
  MusicShelf,
  Track,
} from "@/lib/types";

EventEmitter.defaultMaxListeners = 30;

let ytmPromise: Promise<YTMusic> | null = null;

async function getYTMusic(): Promise<YTMusic> {
  if (!ytmPromise) {
    ytmPromise = (async () => {
      const client = new YTMusic();
      await client.initialize();
      return client;
    })().catch((err) => {
      ytmPromise = null;
      throw err;
    });
  }
  return ytmPromise;
}

function pickHighResArtwork(
  thumbnails?: Array<{ url: string; width?: number; height?: number }>
): string {
  if (!thumbnails || thumbnails.length === 0) return "";
  const sorted = [...thumbnails].sort(
    (a, b) => (b.width ?? 0) - (a.width ?? 0)
  );
  return sorted[0]?.url ?? "";
}

function mapSong(raw: {
  videoId?: string;
  name?: string;
  artist?: { artistId?: string | null; name?: string };
  artists?: Array<{ artistId?: string | null; name?: string }>;
  album?: { albumId?: string | null; name?: string } | null;
  duration?: number | null;
  thumbnails?: Array<{ url: string; width?: number; height?: number }>;
}): Track | null {
  if (!raw.videoId || !raw.name) return null;
  const artistName =
    raw.artists && raw.artists.length > 0
      ? raw.artists.map((a) => a.name).filter(Boolean).join(", ")
      : raw.artist?.name || "Unknown Artist";
  const artistId =
    raw.artists?.[0]?.artistId || raw.artist?.artistId || undefined;

  return {
    videoId: raw.videoId,
    title: raw.name,
    artist: artistName,
    artistId: artistId || undefined,
    album: raw.album?.name || undefined,
    albumId: raw.album?.albumId || undefined,
    duration: typeof raw.duration === "number" ? raw.duration : 0,
    artwork: pickHighResArtwork(raw.thumbnails),
  };
}

export async function searchTracks(query: string, limit = 18): Promise<Track[]> {
  const q = query.trim();
  if (!q) return [];
  const ytm = await getYTMusic();
  const songs = await ytm.searchSongs(q);
  const seen = new Set<string>();
  const results: Track[] = [];

  for (const s of songs) {
    const mapped = mapSong(s);
    if (!mapped || seen.has(mapped.videoId)) continue;
    seen.add(mapped.videoId);
    results.push(mapped);
    if (results.length >= limit) break;
  }
  return results;
}

export async function searchAll(query: string): Promise<{
  tracks: Track[];
  artists: ArtistSummary[];
  albums: AlbumSummary[];
}> {
  const q = query.trim();
  if (!q) return { tracks: [], artists: [], albums: [] };
  const ytm = await getYTMusic();

  const [rawSongs, rawArtists, rawAlbums] = await Promise.all([
    ytm.searchSongs(q).catch(() => []),
    ytm.searchArtists(q).catch(() => []),
    ytm.searchAlbums(q).catch(() => []),
  ]);

  const seenTracks = new Set<string>();
  const tracks: Track[] = [];
  for (const s of rawSongs) {
    const mapped = mapSong(s);
    if (!mapped || seenTracks.has(mapped.videoId)) continue;
    seenTracks.add(mapped.videoId);
    tracks.push(mapped);
    if (tracks.length >= 20) break;
  }

  const artists: ArtistSummary[] = rawArtists
    .filter((a) => a.artistId && a.name)
    .slice(0, 8)
    .map((a) => ({
      artistId: a.artistId,
      name: a.name,
      artwork: pickHighResArtwork(a.thumbnails),
    }));

  const albums: AlbumSummary[] = rawAlbums
    .filter((a) => a.albumId && a.name)
    .slice(0, 10)
    .map((a) => ({
      albumId: a.albumId,
      name: a.name,
      artist: a.artist?.name || "Unknown Artist",
      year: a.year ?? null,
      artwork: pickHighResArtwork(a.thumbnails),
    }));

  return { tracks, artists, albums };
}

const artistCache = new Map<string, { data: ArtistDetail; expiresAt: number }>();
const albumCache = new Map<string, { data: AlbumDetail; expiresAt: number }>();

export async function getArtistDetail(
  artistId: string
): Promise<ArtistDetail | null> {
  const cached = artistCache.get(artistId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const ytm = await getYTMusic();
    const raw = await ytm.getArtist(artistId);
    if (!raw || !raw.name) return null;

    const topSongs = (raw.topSongs || [])
      .map((s) => mapSong(s))
      .filter((t): t is Track => Boolean(t));

    const albums: AlbumSummary[] = (raw.topAlbums || [])
      .filter((a) => a.albumId && a.name)
      .map((a) => ({
        albumId: a.albumId,
        name: a.name,
        artist: raw.name,
        year: a.year ?? null,
        artwork: pickHighResArtwork(a.thumbnails),
      }));

    const singles: AlbumSummary[] = (raw.topSingles || [])
      .filter((a) => a.albumId && a.name)
      .map((a) => ({
        albumId: a.albumId,
        name: a.name,
        artist: raw.name,
        year: a.year ?? null,
        artwork: pickHighResArtwork(a.thumbnails),
      }));

    const similarArtists: ArtistSummary[] = (raw.similarArtists || [])
      .filter((a) => a.artistId && a.name)
      .map((a) => ({
        artistId: a.artistId,
        name: a.name,
        artwork: pickHighResArtwork(a.thumbnails),
      }));

    const detail: ArtistDetail = {
      artistId: raw.artistId || artistId,
      name: raw.name,
      artwork: pickHighResArtwork(raw.thumbnails),
      topSongs,
      albums,
      singles,
      similarArtists,
    };
    artistCache.set(artistId, {
      data: detail,
      expiresAt: Date.now() + 1000 * 60 * 15,
    });
    return detail;
  } catch {
    return null;
  }
}

export async function getAlbumDetail(
  albumId: string
): Promise<AlbumDetail | null> {
  const cached = albumCache.get(albumId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  try {
    const ytm = await getYTMusic();
    const raw = await ytm.getAlbum(albumId);
    if (!raw || !raw.name) return null;

    const albumArtwork = pickHighResArtwork(raw.thumbnails);
    const tracks = (raw.songs || [])
      .map((s): Track | null => {
        const mapped = mapSong(s);
        if (!mapped) return null;
        return {
          ...mapped,
          artwork: mapped.artwork || albumArtwork,
          album: raw.name,
          albumId: raw.albumId || albumId,
        };
      })
      .filter((t): t is Track => t !== null);

    const detail: AlbumDetail = {
      albumId: raw.albumId || albumId,
      name: raw.name,
      artist: raw.artist?.name || "Unknown Artist",
      artistId: raw.artist?.artistId || undefined,
      year: raw.year ?? null,
      artwork: albumArtwork,
      tracks,
    };
    albumCache.set(albumId, {
      data: detail,
      expiresAt: Date.now() + 1000 * 60 * 15,
    });
    return detail;
  } catch {
    return null;
  }
}

function parseDurationString(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val !== "string") return 0;
  const parts = val.trim().split(":").map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export async function getRadioTracks(
  videoId: string,
  fallbackArtist?: string
): Promise<Track[]> {
  const seen = new Set<string>([videoId]);
  const results: Track[] = [];

  try {
    const ytm = await getYTMusic();
    const upNexts = await ytm.getUpNexts(videoId);

    for (const rawItem of upNexts || []) {
      const item = rawItem as unknown as {
        videoId?: string;
        title?: string;
        artists?:
          | string
          | { name?: string; artistId?: string | null }
          | Array<{ name?: string; artistId?: string | null }>;
        duration?: number | string;
        thumbnail?: string;
        thumbnails?: Array<{ url: string; width?: number; height?: number }>;
      };

      if (!item.videoId || !item.title || seen.has(item.videoId)) continue;
      const dur = parseDurationString(item.duration);
      if (dur > 600) continue;
      seen.add(item.videoId);

      let artistName = "Unknown Artist";
      let artistId: string | undefined;
      if (typeof item.artists === "string" && item.artists.trim()) {
        artistName = item.artists.trim();
      } else if (Array.isArray(item.artists) && item.artists.length > 0) {
        artistName =
          item.artists.map((a) => a.name).filter(Boolean).join(", ") ||
          "Unknown Artist";
        artistId = item.artists[0]?.artistId || undefined;
      } else if (
        item.artists &&
        !Array.isArray(item.artists) &&
        typeof item.artists === "object" &&
        item.artists.name
      ) {
        artistName = item.artists.name;
        artistId = item.artists.artistId || undefined;
      }

      const artwork =
        (typeof item.thumbnail === "string" && item.thumbnail) ||
        pickHighResArtwork(item.thumbnails) ||
        `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`;

      results.push({
        videoId: item.videoId,
        title: item.title,
        artist: artistName,
        artistId,
        duration: dur,
        artwork,
      });
      if (results.length >= 13) break;
    }
  } catch {
    // fall through to artist fallback
  }

  // Top up to 13 tracks if getUpNexts returned fewer
  if (results.length < 13 && fallbackArtist) {
    try {
      const fallback = await searchTracks(`${fallbackArtist} songs`, 20);
      for (const t of fallback) {
        if (seen.has(t.videoId)) continue;
        if (t.duration > 600) continue;
        seen.add(t.videoId);
        results.push(t);
        if (results.length >= 13) break;
      }
    } catch {
      // ignore
    }
  }

  return results;
}

const HOME_SHELF_DEFS = [
  {
    id: "top-hits",
    title: "Top Hits",
    subtitle: "Global chart favorites",
    query: "top pop hits 2025",
  },
  {
    id: "kpop",
    title: "K-Pop Vinyl",
    subtitle: "Fresh Korean pop & R&B",
    query: "kpop top songs 2025",
  },
  {
    id: "anime-ost",
    title: "Anime & J-Pop",
    subtitle: "Openings, endings & soundtracks",
    query: "popular anime opening songs",
  },
  {
    id: "chill-lofi",
    title: "Late Night Chill",
    subtitle: "Lo-fi, indie & smooth R&B",
    query: "chill rnb indie late night",
  },
];

let cachedShelves: { data: MusicShelf[]; expiresAt: number } | null = null;

export async function getHomeShelves(): Promise<MusicShelf[]> {
  if (cachedShelves && Date.now() < cachedShelves.expiresAt) {
    return cachedShelves.data;
  }

  const shelves = await Promise.all(
    HOME_SHELF_DEFS.map(async (def) => {
      try {
        const rawTracks = await searchTracks(def.query, 16);
        const tracks = rawTracks
          .filter((t) => t.duration === 0 || t.duration <= 600)
          .slice(0, 10);
        return {
          id: def.id,
          title: def.title,
          subtitle: def.subtitle,
          tracks,
        };
      } catch {
        return {
          id: def.id,
          title: def.title,
          subtitle: def.subtitle,
          tracks: [],
        };
      }
    })
  );

  const nonEmpty = shelves.filter((s) => s.tracks.length > 0);
  if (nonEmpty.length > 0) {
    cachedShelves = {
      data: nonEmpty,
      expiresAt: Date.now() + 1000 * 60 * 15,
    };
  }
  return nonEmpty;
}
