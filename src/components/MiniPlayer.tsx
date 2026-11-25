"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronUp,
  Compass,
  Disc3,
  Heart,
  Home,
  Library,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { EqualizerBars } from "@/components/EqualizerBars";
import { usePlayer } from "@/components/PlayerContext";
import { WaveformSeekBar } from "@/components/WaveformSeekBar";
import { formatTime } from "@/lib/storage";

export function MiniPlayer() {
  const pathname = usePathname();
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    setIsExpanded,
    togglePlay,
    seekTo,
    nextTrack,
    prevTrack,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    isLiked,
    toggleLike,
  } = usePlayer();

  const liked = currentTrack ? isLiked(currentTrack.videoId) : false;
  const effectiveDuration = duration || currentTrack?.duration || 1;
  const progressPct = currentTrack
    ? Math.min(100, (currentTime / effectiveDuration) * 100)
    : 0;

  return (
    <>
      {/* Desktop: Full-width fixed Liquid Glass bottom player bar (properly bounded) */}
      <footer className="glass-bar fixed inset-x-0 bottom-0 z-40 hidden h-20 lg:flex lg:items-center">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_minmax(0,520px)_minmax(0,1fr)] items-center gap-4 px-6">
        {/* Left: Current track + mini spinning vinyl */}
        <div className="flex min-w-0 items-center gap-3">
          {currentTrack ? (
            <>
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                title="Open Vinyl Player"
                className="vinyl-spin-fast vinyl-grooves relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15"
                style={{
                  animationPlayState: isPlaying ? "running" : "paused",
                }}
              >
                {currentTrack.artwork && (
                  <img
                    src={currentTrack.artwork}
                    alt={currentTrack.title}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                )}
                <div className="absolute h-1.5 w-1.5 rounded-full bg-black" />
              </button>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2">
                  {currentTrack.albumId ? (
                    <Link
                      href={`/album/${encodeURIComponent(currentTrack.albumId)}`}
                      className="block truncate text-sm font-medium text-white hover:text-[#38bdf8] hover:underline"
                    >
                      {currentTrack.title}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsExpanded(true)}
                      className="block max-w-full truncate text-left text-sm font-medium text-white hover:underline"
                    >
                      {currentTrack.title}
                    </button>
                  )}
                  <EqualizerBars playing={isPlaying} className="shrink-0" />
                  <button
                    type="button"
                    onClick={() => toggleLike(currentTrack)}
                    aria-label={liked ? "Unlike" : "Like"}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                      liked ? "text-[#38bdf8]" : "text-[#a7a7a7] hover:text-white"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
                  </button>
                </div>
                <Link
                  href={
                    currentTrack.artistId
                      ? `/artist/${encodeURIComponent(currentTrack.artistId)}`
                      : `/?q=${encodeURIComponent(currentTrack.artist)}`
                  }
                  className="block truncate text-xs text-[#a7a7a7] hover:text-[#38bdf8] hover:underline"
                >
                  {currentTrack.artist}
                </Link>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-xs text-[#737373]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#181818]">
                <Disc3 className="h-5 w-5" />
              </div>
              <span>Pick a track to spin</span>
            </div>
          )}
        </div>

        {/* Center: Controls + seek bar */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label="Shuffle"
              className={`transition-colors ${
                shuffle ? "text-[#38bdf8]" : "text-[#a7a7a7] hover:text-white"
              }`}
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={prevTrack}
              aria-label="Previous"
              className="text-[#b3b3b3] transition-colors hover:text-white"
            >
              <SkipBack className="h-4 w-4 fill-current" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              disabled={!currentTrack}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 disabled:opacity-40"
            >
              {isBuffering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              )}
            </button>
            <button
              type="button"
              onClick={nextTrack}
              aria-label="Next"
              className="text-[#b3b3b3] transition-colors hover:text-white"
            >
              <SkipForward className="h-4 w-4 fill-current" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              aria-label="Repeat"
              className={`transition-colors ${
                repeat !== "off"
                  ? "text-[#38bdf8]"
                  : "text-[#a7a7a7] hover:text-white"
              }`}
            >
              {repeat === "one" ? (
                <Repeat1 className="h-4 w-4" />
              ) : (
                <Repeat className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex w-full items-center gap-2.5">
            <span className="w-9 text-right text-[11px] tabular-nums text-[#a7a7a7]">
              {formatTime(currentTime)}
            </span>
            <WaveformSeekBar
              seed={currentTrack?.videoId || "idle"}
              currentTime={currentTime}
              duration={currentTrack ? effectiveDuration : 0}
              disabled={!currentTrack}
              onSeek={seekTo}
              bars={48}
              heightClass="h-5"
            />
            <span className="w-9 text-[11px] tabular-nums text-[#a7a7a7]">
              {formatTime(currentTrack ? effectiveDuration : 0)}
            </span>
          </div>
        </div>

        {/* Right: Volume + Expand player chevron */}
        <div className="flex items-center justify-end gap-4">
          <div className="flex w-28 items-center gap-2">
            <button
              type="button"
              onClick={() => setVolume(volume > 0 ? 0 : 85)}
              aria-label="Mute"
              className="text-[#a7a7a7] hover:text-white"
            >
              {volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              className="h-1 w-full min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-[#4d4d4d] accent-[#38bdf8]"
            />
          </div>

          {currentTrack && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              aria-label="Open music player"
              title="Open music player"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#d5dfee] transition-colors hover:bg-white/10 hover:text-white"
            >
              <ChevronUp className="h-6 w-6" />
            </button>
          )}
        </div>
        </div>
      </footer>

      {/* Mobile: Liquid Glass mini bar + bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        {currentTrack && (
          <div className="mx-2 mb-1.5 overflow-hidden rounded-2xl border border-white/12 bg-[#0b0b0e]/95 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 px-2.5 py-2">
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
              >
                <div
                  className="vinyl-spin-fast vinyl-grooves relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15"
                  style={{
                    animationPlayState: isPlaying ? "running" : "paused",
                  }}
                >
                  {currentTrack.artwork && (
                    <img
                      src={currentTrack.artwork}
                      alt={currentTrack.title}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">
                    {currentTrack.title}
                  </p>
                  <p className="truncate text-[11px] text-[#a7a7a7]">
                    {currentTrack.artist}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="flex h-9 w-9 items-center justify-center text-white"
              >
                {isBuffering ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current" />
                )}
              </button>
              <button
                type="button"
                onClick={nextTrack}
                aria-label="Next"
                className="flex h-9 w-9 items-center justify-center text-[#b3b3b3]"
              >
                <SkipForward className="h-4 w-4 fill-current" />
              </button>
            </div>
            <div className="h-[2px] w-full bg-white/10">
              <div
                className="h-full bg-[#38bdf8]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <nav className="glass-bar flex h-14 items-center justify-around pb-[env(safe-area-inset-bottom)]">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
              pathname === "/" ? "text-[#38bdf8]" : "text-[#8e8e8e]"
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/explore"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
              pathname.startsWith("/explore") ? "text-[#38bdf8]" : "text-[#8e8e8e]"
            }`}
          >
            <Compass className="h-5 w-5" />
            <span>Explore</span>
          </Link>
          <Link
            href="/library"
            className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
              pathname.startsWith("/library") ? "text-[#38bdf8]" : "text-[#8e8e8e]"
            }`}
          >
            <Library className="h-5 w-5" />
            <span>Library</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
