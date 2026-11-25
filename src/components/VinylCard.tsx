"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Pause, Play, Plus } from "lucide-react";
import { useState } from "react";
import { EqualizerBars } from "@/components/EqualizerBars";
import { usePlayer } from "@/components/PlayerContext";
import { formatTime } from "@/lib/storage";
import type { Track } from "@/lib/types";

interface VinylCardProps {
  track: Track;
  queue: Track[];
}

export function VinylCard({ track, queue }: VinylCardProps) {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    addToQueue,
    setIsExpanded,
    isLiked,
    toggleLike,
  } = usePlayer();

  const [isHovered, setIsHovered] = useState(false);
  const isCurrent = currentTrack?.videoId === track.videoId;
  const liked = isLiked(track.videoId);
  const activeVisual = isHovered || isCurrent;

  function handlePlay() {
    if (isCurrent) {
      togglePlay();
    } else {
      // Start a fresh radio queue seeded from this song so Radio Auto-Play
      // immediately fills relevant songs, collabs, and similar artists.
      playTrack(track, [track]);
      setIsExpanded(true);
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="glass-card group flex h-fit flex-col self-start overflow-hidden rounded-2xl p-2.5 select-none sm:p-3.5"
    >
      {/* Great UI spring-animated Vinyl + Cover stage */}
      <div
        onClick={handlePlay}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePlay();
          }
        }}
        className="relative mb-3.5 flex aspect-[4/3] w-full cursor-pointer items-center justify-start overflow-visible"
      >
        {/* Spring-out smooth shiny dark metal disc (no groove lines) */}
        <motion.div
          className="absolute left-2 flex aspect-square h-[88%] items-center justify-center overflow-hidden rounded-full border border-white/20 shadow-[inset_0_0_14px_rgba(255,255,255,0.18)]"
          style={{
            background:
              "conic-gradient(from 25deg, #16171a 0deg, #4b4f58 26deg, #0d0e11 60deg, #2d3037 108deg, #5c616c 148deg, #0b0c0e 196deg, #32363e 236deg, #636975 272deg, #121316 318deg, #16171a 360deg)",
          }}
          initial={{ x: 0, rotate: 0 }}
          animate={{
            x: activeVisual ? "36%" : "12%",
            rotate: activeVisual ? 180 : 0,
          }}
          transition={{ type: "spring", stiffness: 80, damping: 15, mass: 1 }}
        >
          {/* Subtle dark metallic specular sheen */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full opacity-45"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.28), transparent 52%)",
            }}
          />

          {/* Song cover in the center */}
          <div className="relative z-10 flex h-[44%] w-[44%] items-center justify-center overflow-hidden rounded-full border-2 border-white/25 bg-[#0a0a0c]">
            {track.artwork && (
              <img
                src={track.artwork}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full scale-[1.05] object-cover"
              />
            )}
            <div className="z-10 h-2.5 w-2.5 rounded-full bg-[#0a0a0c] ring-2 ring-white/40" />
          </div>
        </motion.div>

        {/* Spring-tilting square album cover (locked to 75% width so 16:9 thumbnails never stretch the card) */}
        <motion.div
          className="relative z-10 aspect-square w-[75%] shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/[0.06]"
          initial={{ rotate: 0, scale: 1, x: 0 }}
          animate={{
            rotate: isHovered ? -4 : 0,
            scale: isHovered ? 0.96 : 1,
            x: isHovered ? -10 : 0,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 20 }}
        >
          {track.artwork && (
            <img
              src={track.artwork}
              alt={track.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full scale-[1.03] object-cover"
            />
          )}

          {/* Duration pill or Live Equalizer badge */}
          {isCurrent ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 backdrop-blur-md">
              <EqualizerBars playing={isPlaying} />
            </span>
          ) : (
            track.duration > 0 && (
              <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium tabular-nums text-white backdrop-blur-md">
                {formatTime(track.duration)}
              </span>
            )
          )}

          {/* Play button */}
          <span
            className={`absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#38bdf8] text-[#07131a] transition-all duration-200 ${
              isCurrent
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
            }`}
          >
            {isCurrent && isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="ml-0.5 h-4 w-4 fill-current" />
            )}
          </span>
        </motion.div>
      </div>

      {/* Track metadata + quick actions aligned with title */}
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-1">
          {track.albumId ? (
            <Link
              href={`/album/${encodeURIComponent(track.albumId)}`}
              className={`min-w-0 flex-1 truncate text-[15px] font-semibold leading-snug hover:text-[#38bdf8] hover:underline ${
                isCurrent ? "text-[#38bdf8]" : "text-white"
              }`}
            >
              {track.title}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              className={`min-w-0 flex-1 truncate text-left text-[15px] font-semibold leading-snug hover:text-[#38bdf8] hover:underline ${
                isCurrent ? "text-[#38bdf8]" : "text-white"
              }`}
            >
              {track.title}
            </button>
          )}

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => toggleLike(track)}
              aria-label="Like track"
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                liked
                  ? "text-[#38bdf8]"
                  : "text-[#8f9bb0] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => addToQueue(track)}
              aria-label="Add to queue"
              title="Add to queue"
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#8f9bb0] transition-colors hover:bg-white/10 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <Link
          href={
            track.artistId
              ? `/artist/${encodeURIComponent(track.artistId)}`
              : `/?q=${encodeURIComponent(track.artist)}`
          }
          className="mt-0.5 block truncate text-xs text-[#9aa6bc] hover:text-[#38bdf8] hover:underline"
        >
          {track.artist}
        </Link>
      </div>
    </div>
  );
}
