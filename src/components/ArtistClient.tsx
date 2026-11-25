"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Pause, Play, Plus, Shuffle } from "lucide-react";
import { usePlayer } from "@/components/PlayerContext";
import { formatTime } from "@/lib/storage";
import type { ArtistDetail } from "@/lib/types";

export function ArtistClient({ artist }: { artist: ArtistDetail }) {
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    playTrack,
    playAll,
    togglePlay,
    addToQueue,
    setIsExpanded,
    isLiked,
    toggleLike,
  } = usePlayer();

  const releases = [...artist.albums, ...artist.singles];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-10 pt-6 sm:px-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="glass-pill mb-5 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-[#d5dfee] hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back</span>
      </button>

      {/* Artist Hero */}
      <section className="glass-panel flex flex-col items-center gap-6 rounded-3xl p-6 sm:flex-row sm:p-8">
        <div className="h-36 w-36 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/[0.06] sm:h-44 sm:w-44">
          {artist.artwork && (
            <img
              src={artist.artwork}
              alt={artist.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#38bdf8]">
            Artist
          </span>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {artist.name}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {artist.topSongs.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    playAll(artist.topSongs, false);
                    setIsExpanded(true);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[#38bdf8] px-5 text-sm font-semibold text-[#07131a]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Play Top Songs</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playAll(artist.topSongs, true);
                    setIsExpanded(true);
                  }}
                  className="glass-pill inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white hover:bg-white/[0.12]"
                >
                  <Shuffle className="h-4 w-4 text-[#38bdf8]" />
                  <span>Shuffle</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Top Songs */}
      {artist.topSongs.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold text-white">Top Songs</h2>
          <div className="glass-panel divide-y divide-white/[0.07] overflow-hidden rounded-2xl">
            {artist.topSongs.map((track, idx) => {
              const isCurrent = currentTrack?.videoId === track.videoId;
              const liked = isLiked(track.videoId);
              return (
                <div
                  key={track.videoId}
                  className={`flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.06] sm:px-4 ${
                    isCurrent ? "bg-white/[0.1]" : ""
                  }`}
                >
                  <span className="w-5 text-center text-xs tabular-nums text-[#7c889e]">
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isCurrent) {
                        togglePlay();
                      } else {
                        playTrack(track, artist.topSongs);
                        setIsExpanded(true);
                      }
                    }}
                    className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]"
                  >
                    {track.artwork && (
                      <img
                        src={track.artwork}
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                      {isCurrent && isPlaying ? (
                        <Pause className="h-4 w-4 fill-white text-white" />
                      ) : (
                        <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
                      )}
                    </span>
                  </button>

                  <div className="min-w-0 flex-1 text-left">
                    {track.albumId ? (
                      <Link
                        href={`/album/${encodeURIComponent(track.albumId)}`}
                        className={`block truncate text-sm font-semibold hover:text-[#38bdf8] hover:underline ${
                          isCurrent ? "text-[#38bdf8]" : "text-white"
                        }`}
                      >
                        {track.title}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          playTrack(track, artist.topSongs);
                          setIsExpanded(true);
                        }}
                        className={`block w-full truncate text-left text-sm font-semibold hover:text-[#38bdf8] hover:underline ${
                          isCurrent ? "text-[#38bdf8]" : "text-white"
                        }`}
                      >
                        {track.title}
                      </button>
                    )}
                    {track.album && (
                      <p className="truncate text-xs text-[#9aa6bc]">
                        {track.album}
                      </p>
                    )}
                  </div>

                  <span className="hidden text-xs tabular-nums text-[#7c889e] sm:inline">
                    {formatTime(track.duration)}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleLike(track)}
                    aria-label="Like"
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      liked
                        ? "text-[#38bdf8]"
                        : "text-[#8f9bb0] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => addToQueue(track)}
                    aria-label="Add to queue"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#8f9bb0] hover:bg-white/10 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Albums & Singles */}
      {releases.length > 0 && (
        <section className="mt-9">
          <h2 className="mb-4 text-xl font-bold text-white">
            Albums & Singles
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {releases.map((alb) => (
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
                {alb.year && (
                  <p className="mt-0.5 text-xs text-[#9aa6bc]">{alb.year}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Similar Artists */}
      {artist.similarArtists.length > 0 && (
        <section className="mt-9">
          <h2 className="mb-4 text-xl font-bold text-white">Similar Artists</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {artist.similarArtists.map((sim) => (
              <Link
                key={sim.artistId}
                href={`/artist/${encodeURIComponent(sim.artistId)}`}
                className="glass-card flex flex-col items-center rounded-2xl p-4 text-center"
              >
                <div className="mb-3 aspect-square w-28 overflow-hidden rounded-full bg-white/[0.06]">
                  {sim.artwork && (
                    <img
                      src={sim.artwork}
                      alt={sim.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <p className="w-full truncate text-sm font-semibold text-white">
                  {sim.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
