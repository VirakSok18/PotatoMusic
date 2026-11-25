import type { Playlist, Track } from "@/lib/types";

const LIKED_KEY = "potatomusic_liked_v1";
const RECENT_KEY = "potatomusic_recent_v1";
const PLAYLISTS_KEY = "potatomusic_playlists_v1";
const SESSION_KEY = "potatomusic_session_v1";
const SEARCHES_KEY = "potatomusic_searches_v1";

function safeParse<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSave<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function getLikedTracks(): Track[] {
  return safeParse<Track[]>(LIKED_KEY, []);
}

export function saveLikedTracks(tracks: Track[]) {
  safeSave(LIKED_KEY, tracks);
}

export function getRecentTracks(): Track[] {
  return safeParse<Track[]>(RECENT_KEY, []);
}

export function saveRecentTracks(tracks: Track[]) {
  safeSave(RECENT_KEY, tracks.slice(0, 30));
}

export function getPlaylists(): Playlist[] {
  return safeParse<Playlist[]>(PLAYLISTS_KEY, []);
}

export function savePlaylists(playlists: Playlist[]) {
  safeSave(PLAYLISTS_KEY, playlists);
}

export interface SavedSession {
  queue: Track[];
  currentIndex: number;
}

export function getSavedSession(): SavedSession | null {
  return safeParse<SavedSession | null>(SESSION_KEY, null);
}

export function saveSession(session: SavedSession) {
  safeSave(SESSION_KEY, {
    queue: session.queue.slice(0, 50),
    currentIndex: session.currentIndex,
  });
}

export function getRecentSearches(): string[] {
  return safeParse<string[]>(SEARCHES_KEY, []);
}

export function saveRecentSearches(queries: string[]) {
  safeSave(SEARCHES_KEY, queries.slice(0, 8));
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
