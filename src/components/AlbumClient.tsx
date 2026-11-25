"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Pause, Play, Plus, Shuffle } from "lucide-react";
import { usePlayer } from "@/components/PlayerContext";
import { formatTime } from "@/lib/storage";
import type { AlbumDetail } from "@/lib/types";

export function AlbumClient({ album }: { album: AlbumDetail }) {
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

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-10 pt-6 sm:px-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="glass-pill mb-5 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium text-[#d5dfee] hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back</span>
      </button>

      {/* Album Hero */}
      <section className="glass-panel flex flex-col items-center gap-6 rounded-3xl p-6 sm:flex-row sm:p-8">
        <div className="h-44 w-44 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] sm:h-52 sm:w-52">
          {album.artwork && (
            <img
              src={album.artwork}
              alt={album.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#38bdf8]">
            Album {album.year ? `· ${album.year}` : ""}
          </span>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-4xl">
            {album.name}
          </h1>
          <div className="mt-1.5 text-sm text-[#9aa6bc]">
            {album.artistId ? (
              <Link
                href={`/artist/${encodeURIComponent(album.artistId)}`}
                className="font-medium text-white hover:text-[#38bdf8] hover:underline"
              >
                {album.artist}
              </Link>
            ) : (
              <span>{album.artist}</span>
            )}{" "}
            · {album.tracks.length} tracks
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {album.tracks.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    playAll(album.tracks, false);
                    setIsExpanded(true);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[#38bdf8] px-5 text-sm font-semibold text-[#07131a]"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Play Album</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playAll(album.tracks, true);
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

      {/* Tracklist */}
      <section className="mt-8">
        <div className="glass-panel divide-y divide-white/[0.07] overflow-hidden rounded-2xl">
          {album.tracks.map((track, idx) => {
            const isCurrent = currentTrack?.videoId === track.videoId;
            const liked = isLiked(track.videoId);
            return (
              <div
                key={track.videoId}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.06] ${
                  isCurrent ? "bg-white/[0.1]" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playTrack(track, album.tracks);
                      setIsExpanded(true);
                    }
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums text-[#9aa6bc] hover:bg-white/10 hover:text-white"
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="h-4 w-4 fill-[#38bdf8] text-[#38bdf8]" />
                  ) : (
                    idx + 1
                  )}
                </button>

                <div className="min-w-0 flex-1 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      playTrack(track, album.tracks);
                      setIsExpanded(true);
                    }}
                    className={`block w-full truncate text-left text-sm font-semibold hover:text-[#38bdf8] hover:underline ${
                      isCurrent ? "text-[#38bdf8]" : "text-white"
                    }`}
                  >
                    {track.title}
                  </button>
                  <Link
                    href={
                      track.artistId
                        ? `/artist/${encodeURIComponent(track.artistId)}`
                        : `/?q=${encodeURIComponent(track.artist)}`
                    }
                    className="block truncate text-xs text-[#9aa6bc] hover:text-[#38bdf8] hover:underline"
                  >
                    {track.artist}
                  </Link>
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
    </div>
  );
}
