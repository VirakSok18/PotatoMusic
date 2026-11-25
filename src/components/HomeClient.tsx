"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlayer } from "@/components/PlayerContext";
import { VinylCard } from "@/components/VinylCard";
import type {
  AlbumSummary,
  ArtistSummary,
  MusicShelf,
  Track,
} from "@/lib/types";

interface HomeClientProps {
  initialShelves: MusicShelf[];
}

const searchCache = new Map<
  string,
  { tracks: Track[]; artists: ArtistSummary[]; albums: AlbumSummary[] }
>();

export function HomeClient({ initialShelves }: HomeClientProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { recentTracks, playAll, setIsExpanded } = usePlayer();

  const initialKey = query.trim().toLowerCase();
  const initialCached = initialKey ? searchCache.get(initialKey) : undefined;

  const [searchResults, setSearchResults] = useState<Track[]>(
    () => initialCached?.tracks || []
  );
  const [artistResults, setArtistResults] = useState<ArtistSummary[]>(
    () => initialCached?.artists || []
  );
  const [albumResults, setAlbumResults] = useState<AlbumSummary[]>(
    () => initialCached?.albums || []
  );
  const [searchTab, setSearchTab] = useState<
    "all" | "songs" | "artists" | "albums"
  >("all");
  const [searching, setSearching] = useState(
    () => Boolean(initialKey) && !initialCached
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setArtistResults([]);
      setAlbumResults([]);
      setSearching(false);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached) {
      setSearchResults(cached.tracks);
      setArtistResults(cached.artists);
      setAlbumResults(cached.albums);
      setSearching(false);
      return;
    }

    // Set searching immediately so "No results found" never flashes while typing
    setSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then(
          (data: {
            tracks?: Track[];
            artists?: ArtistSummary[];
            albums?: AlbumSummary[];
          }) => {
            if (controller.signal.aborted) return;
            const payload = {
              tracks: data.tracks || [],
              artists: data.artists || [],
              albums: data.albums || [],
            };
            searchCache.set(cacheKey, payload);
            setSearchResults(payload.tracks);
            setArtistResults(payload.artists);
            setAlbumResults(payload.albums);
            setSearching(false);
          }
        )
        .catch(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-8">
      {/* Search Results */}
      {query.trim() ? (
        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "songs", "artists", "albums"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSearchTab(t)}
                  className={`h-8 rounded-full px-3.5 text-xs font-semibold capitalize transition-colors ${
                    searchTab === t
                      ? "bg-[#38bdf8] text-[#07131a]"
                      : "glass-pill text-[#d5dfee] hover:bg-white/[0.12]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {searching && (
              <Loader2 className="h-5 w-5 animate-spin text-[#38bdf8]" />
            )}
          </div>

          {searching ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="glass-card animate-pulse rounded-2xl p-3.5"
                >
                  <div className="mb-3.5 aspect-[4/3] w-full rounded-xl bg-white/[0.08]" />
                  <div className="h-4 w-3/4 rounded bg-white/[0.09]" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ) : searchResults.length === 0 &&
            artistResults.length === 0 &&
            albumResults.length === 0 ? (
            <p className="glass-panel rounded-2xl p-10 text-center text-sm text-[#9aa6bc]">
              No results found for &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <>
              {(searchTab === "all" || searchTab === "artists") &&
                artistResults.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-xl font-bold text-white">
                      Artists
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {artistResults.map((artist) => (
                        <Link
                          key={artist.artistId}
                          href={`/artist/${encodeURIComponent(artist.artistId)}`}
                          className="glass-card flex flex-col items-center rounded-2xl p-4 text-center"
                        >
                          <div className="mb-3 aspect-square w-24 overflow-hidden rounded-full bg-white/[0.06]">
                            {artist.artwork && (
                              <img
                                src={artist.artwork}
                                alt={artist.name}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <p className="w-full truncate text-sm font-semibold text-white">
                            {artist.name}
                          </p>
                          <span className="mt-0.5 text-[11px] text-[#9aa6bc]">
                            Artist
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              {(searchTab === "all" || searchTab === "albums") &&
                albumResults.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-xl font-bold text-white">
                      Albums
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {albumResults.map((alb) => (
                        <Link
                          key={alb.albumId}
                          href={`/album/${encodeURIComponent(alb.albumId)}`}
                          className="glass-card flex flex-col rounded-2xl p-3"
                        >
                          <div className="mb-3 aspect-square w-full overflow-hidden rounded-xl bg-white/[0.06]">
                            {alb.artwork && (
                              <img
                                src={alb.artwork}
                                alt={alb.name}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <p className="truncate text-sm font-semibold text-white">
                            {alb.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[#9aa6bc]">
                            {alb.artist}
                            {alb.year ? ` · ${alb.year}` : ""}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              {(searchTab === "all" || searchTab === "songs") &&
                searchResults.length > 0 && (
                  <div>
                    <h2 className="mb-4 text-xl font-bold text-white">Songs</h2>
                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {searchResults.map((track) => (
                        <VinylCard
                          key={track.videoId}
                          track={track}
                          queue={searchResults}
                        />
                      ))}
                    </div>
                  </div>
                )}
            </>
          )}
        </section>
      ) : (
        <>
          {/* Jump Back In (shown when user has recently played tracks) */}
          {recentTracks.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    Jump Back In
                  </h2>
                  <p className="mt-0.5 text-sm text-[#9aa6bc]">
                    Recently played tracks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playAll(recentTracks, false);
                    setIsExpanded(true);
                  }}
                  className="glass-pill inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-white hover:bg-white/[0.12]"
                >
                  <Play className="h-3 w-3 fill-current text-[#38bdf8]" />
                  <span>Play All</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {recentTracks.slice(0, 5).map((track) => (
                  <VinylCard
                    key={track.videoId}
                    track={track}
                    queue={recentTracks}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Full-width Vinyl Shelves */}
          <div className="space-y-12">
            {initialShelves.map((shelf) => (
              <section key={shelf.id}>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                      {shelf.title}
                    </h2>
                    <p className="mt-0.5 text-sm text-[#9aa6bc]">
                      {shelf.subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playAll(shelf.tracks, false);
                      setIsExpanded(true);
                    }}
                    className="glass-pill inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-white hover:bg-white/[0.12]"
                  >
                    <Play className="h-3 w-3 fill-current text-[#38bdf8]" />
                    <span>Play All</span>
                  </button>
                </div>
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {shelf.tracks.slice(0, 10).map((track) => (
                      <VinylCard
                        key={track.videoId}
                        track={track}
                        queue={shelf.tracks}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
  );
}
