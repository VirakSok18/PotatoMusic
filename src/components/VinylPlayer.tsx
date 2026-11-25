"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Heart,
  ListMusic,
  Loader2,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlayer } from "@/components/PlayerContext";
import { WaveformSeekBar } from "@/components/WaveformSeekBar";
import DiscCascadeCarousel, {
  type DiscCascadeItem,
} from "@/components/ui/disc-cascade-carousel";
import { formatTime } from "@/lib/storage";
import type { LyricLine } from "@/lib/types";

export function VinylPlayer() {
  const {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    shuffle,
    repeat,
    isExpanded,
    setIsExpanded,
    playTrack,
    removeFromQueue,
    clearQueue,
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

  const [panelTab, setPanelTab] = useState<"lyrics" | "queue">("lyrics");
  const [showDrawer, setShowDrawer] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const [syncedLyrics, setSyncedLyrics] = useState<LyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);

  const activeLineRef = useRef<HTMLButtonElement | null>(null);
  const centerActiveLineRef = useRef<HTMLButtonElement | null>(null);
  const userScrollingLyricsRef = useRef(false);
  const scrollResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentTrack) return;
    let cancelled = false;
    setLyricsLoading(true);
    setSyncedLyrics([]);
    setPlainLyrics(null);

    const params = new URLSearchParams({
      title: currentTrack.title,
      artist: currentTrack.artist,
      duration: String(currentTrack.duration || 0),
    });

    fetch(`/api/lyrics?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { synced?: LyricLine[]; plain?: string | null }) => {
        if (cancelled) return;
        setSyncedLyrics(data.synced || []);
        setPlainLyrics(data.plain || null);
      })
      .catch(() => {
        if (!cancelled) {
          setSyncedLyrics([]);
          setPlainLyrics(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLyricsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentTrack?.videoId]);

  const activeLyricIndex = syncedLyrics.reduce((acc, line, idx) => {
    if (line.time <= currentTime + 0.3) return idx;
    return acc;
  }, -1);

  useEffect(() => {
    if (!isExpanded) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;
    if (showDrawer) {
      activeLineRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    if (!userScrollingLyricsRef.current) {
      centerActiveLineRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeLyricIndex, isExpanded, showDrawer]);

  const discItems: DiscCascadeItem[] = useMemo(
    () =>
      queue.map((t) => ({
        title: t.title,
        src: t.artwork || undefined,
        alt: `${t.title} by ${t.artist}`,
        label: "",
        fine: `${t.artist}${t.album ? ` · ${t.album}` : ""}`,
        credits: [
          { label: "Artist", value: t.artist },
          ...(t.album ? [{ label: "Album", value: t.album }] : []),
          ...(t.duration > 0
            ? [{ label: "Length", value: formatTime(t.duration) }]
            : []),
        ],
      })),
    [queue]
  );

  const router = useRouter();
  const handleDiscIndexChange = useCallback(
    (idx: number) => {
      const target = queue[idx];
      if (target && target.videoId !== currentTrack?.videoId) {
        playTrack(target, queue);
      }
    },
    [queue, currentTrack?.videoId, playTrack]
  );

  const handleDiscCaptionClick = useCallback(
    (_item: DiscCascadeItem, idx: number) => {
      const target = queue[idx];
      if (!target) return;
      setIsExpanded(false);
      if (target.albumId) {
        router.push(`/album/${encodeURIComponent(target.albumId)}`);
      } else {
        router.push(`/?q=${encodeURIComponent(`${target.title} ${target.artist}`)}`);
      }
    },
    [queue, router, setIsExpanded]
  );

  if (!isExpanded || !currentTrack) return null;

  const liked = isLiked(currentTrack.videoId);
  const effectiveDuration = duration || currentTrack.duration || 1;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#0a0a0c] text-[#f4f7fb]">
      {/* Top bar */}
      <div className="relative z-20 grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 sm:px-8 sm:py-4">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            aria-label="Close player"
            className="glass-pill flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/[0.14]"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#38bdf8]">
            Now Playing
          </p>
          <p className="max-w-[200px] truncate text-xs text-[#9aa6bc] sm:max-w-xs">
            {currentTrack.album || "PotatoMusic"}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowDrawer((v) => !v)}
            className={`glass-pill flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
              showDrawer
                ? "border-[#38bdf8]/50 bg-[#38bdf8]/20 text-[#38bdf8]"
                : "text-[#c5d0e0] hover:text-white"
            }`}
          >
            <Mic2 className="h-3.5 w-3.5" />
            <span className="sm:hidden">Lyrics</span>
            <span className="hidden sm:inline">Lyrics & Queue</span>
          </button>
        </div>
      </div>

      {/* Main Stage: Full 3D Disc Cascade Carousel + Lyrics/Queue side drawer */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="relative min-w-0 flex-1">
          <DiscCascadeCarousel
            items={discItems}
            index={Math.max(0, currentIndex)}
            onIndexChange={handleDiscIndexChange}
            onSelect={togglePlay}
            onCaptionClick={handleDiscCaptionClick}
            height="100%"
            discSize={
              isMobile ? "164px" : "clamp(220px, min(48vmin, 34vw), 350px)"
            }
            spacing={isMobile ? 1.32 : 1.55}
            rise={0}
            depth={-0.88}
            yaw={0}
            fan={0}
            tilt={0}
            loop={queue.length > 2}
            spin={18}
            paused={!isPlaying}
            details
            controls={false}
            frame={false}
            hint=""
            background="radial-gradient(120% 90% at 50% 45%, #19191d, #0a0a0c 72%)"
            color="#f4f7fb"
          />

          {/* Smooth scrollable faded live lyrics below the disc & title */}
          {syncedLyrics.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center px-5 sm:bottom-11 sm:px-6">
              <div
                onWheel={() => {
                  userScrollingLyricsRef.current = true;
                  if (scrollResumeTimerRef.current)
                    clearTimeout(scrollResumeTimerRef.current);
                  scrollResumeTimerRef.current = setTimeout(() => {
                    userScrollingLyricsRef.current = false;
                  }, 2500);
                }}
                onTouchMove={() => {
                  userScrollingLyricsRef.current = true;
                  if (scrollResumeTimerRef.current)
                    clearTimeout(scrollResumeTimerRef.current);
                  scrollResumeTimerRef.current = setTimeout(() => {
                    userScrollingLyricsRef.current = false;
                  }, 2500);
                }}
                className="pointer-events-auto h-[126px] w-full max-w-3xl overflow-y-auto overscroll-contain text-center [scrollbar-width:none] sm:h-[168px] [&::-webkit-scrollbar]:hidden"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
                }}
              >
                <div className="flex flex-col items-center gap-2 py-16">
                  {syncedLyrics.map((line, idx) => {
                    const isActive = idx === activeLyricIndex;
                    const dist = Math.abs(idx - (activeLyricIndex >= 0 ? activeLyricIndex : 0));
                    const styleClass = isActive
                      ? "text-base font-bold text-white sm:text-lg"
                      : dist === 1
                      ? "text-sm font-medium text-white/55"
                      : "text-xs font-medium text-white/30";
                    return (
                      <button
                        key={`${line.time}-${idx}`}
                        ref={isActive ? centerActiveLineRef : null}
                        type="button"
                        onClick={() => {
                          userScrollingLyricsRef.current = false;
                          seekTo(line.time);
                        }}
                        className={`max-w-full truncate whitespace-nowrap px-2 leading-snug transition-all duration-300 hover:text-[#38bdf8] ${styleClass}`}
                      >
                        {line.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Lyrics & Queue Panel (smoked dark glass so bright discs stay readable) */}
        {showDrawer && (
          <aside className="absolute inset-y-3 right-3 z-30 flex w-[calc(100%-24px)] max-w-sm flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0a0a0c]/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:right-6 sm:w-96">
            <div className="flex items-center gap-2 border-b border-white/10 p-3">
              <button
                type="button"
                onClick={() => setPanelTab("lyrics")}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2 text-xs font-semibold transition-colors ${
                  panelTab === "lyrics"
                    ? "bg-white/15 text-white"
                    : "text-[#8f9bb0] hover:text-white"
                }`}
              >
                <Mic2 className="h-3.5 w-3.5" />
                <span>Lyrics</span>
              </button>
              <button
                type="button"
                onClick={() => setPanelTab("queue")}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2 text-xs font-semibold transition-colors ${
                  panelTab === "queue"
                    ? "bg-white/15 text-white"
                    : "text-[#8f9bb0] hover:text-white"
                }`}
              >
                <ListMusic className="h-3.5 w-3.5" />
                <span>Queue ({queue.length})</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-5">
              {panelTab === "lyrics" ? (
                lyricsLoading ? (
                  <div className="flex h-full items-center justify-center gap-2 text-sm text-[#8f9bb0]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#38bdf8]" />
                    <span>Loading lyrics...</span>
                  </div>
                ) : syncedLyrics.length > 0 ? (
                  <div className="space-y-4 py-6">
                    {syncedLyrics.map((line, idx) => {
                      const isActive = idx === activeLyricIndex;
                      return (
                        <button
                          key={`${line.time}-${idx}`}
                          ref={isActive ? activeLineRef : null}
                          type="button"
                          onClick={() => seekTo(line.time)}
                          className={`block w-full text-left text-base font-semibold leading-snug transition-all ${
                            isActive
                              ? "scale-[1.02] text-[#38bdf8]"
                              : idx < activeLyricIndex
                              ? "text-white/40 hover:text-white/75"
                              : "text-white/70 hover:text-white"
                          }`}
                        >
                          {line.text}
                        </button>
                      );
                    })}
                  </div>
                ) : plainLyrics ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#c5d0e0]">
                    {plainLyrics}
                  </pre>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm text-[#8f9bb0]">
                    No lyrics found for this track.
                  </div>
                )
              ) : (
                <div className="space-y-1.5">
                  {queue.length > 1 && (
                    <div className="mb-2 flex justify-end">
                      <button
                        type="button"
                        onClick={clearQueue}
                        className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-[#9aa6bc] hover:bg-white/[0.12] hover:text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Clear upcoming</span>
                      </button>
                    </div>
                  )}
                  {queue.map((item, idx) => {
                    const isCurrent = idx === currentIndex;
                    return (
                      <div
                        key={`${item.videoId}-${idx}`}
                        className={`group flex w-full items-center gap-2 rounded-xl p-2 transition-colors ${
                          isCurrent
                            ? "bg-[#38bdf8]/15 text-white"
                            : "hover:bg-white/[0.06]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => playTrack(item, queue)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <img
                            src={
                              item.artwork ||
                              `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`
                            }
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-sm font-medium ${
                                isCurrent ? "text-[#38bdf8]" : "text-white"
                              }`}
                            >
                              {item.title}
                            </p>
                            <p className="truncate text-xs text-[#8f9bb0]">
                              {item.artist}
                            </p>
                          </div>
                          <span className="text-[11px] tabular-nums text-[#6f7a8f]">
                            {formatTime(item.duration)}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromQueue(idx)}
                          aria-label="Remove from queue"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#7c889e] opacity-70 transition-colors hover:bg-white/10 hover:text-white group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Seamless Bottom Transport Dock (no divider line, balanced spacing) */}
      <div className="relative z-20 px-5 pb-[max(2.75rem,env(safe-area-inset-bottom))] pt-1 sm:px-8 sm:pb-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
          {/* Mobile: Title + Artist + Like on top */}
          <div className="flex items-center justify-between gap-3 sm:hidden">
            <div className="min-w-0">
              {currentTrack.albumId ? (
                <Link
                  href={`/album/${encodeURIComponent(currentTrack.albumId)}`}
                  onClick={() => setIsExpanded(false)}
                  className="block truncate text-base font-bold text-white hover:text-[#38bdf8]"
                >
                  {currentTrack.title}
                </Link>
              ) : (
                <p className="truncate text-base font-bold text-white">
                  {currentTrack.title}
                </p>
              )}
              <Link
                href={
                  currentTrack.artistId
                    ? `/artist/${encodeURIComponent(currentTrack.artistId)}`
                    : `/?q=${encodeURIComponent(currentTrack.artist)}`
                }
                onClick={() => setIsExpanded(false)}
                className="block truncate text-xs text-[#9aa6bc] hover:text-[#38bdf8]"
              >
                {currentTrack.artist}
              </Link>
            </div>
            <button
              type="button"
              onClick={() => toggleLike(currentTrack)}
              aria-label={liked ? "Unlike" : "Like"}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                liked ? "text-[#38bdf8]" : "text-[#9aa6bc] hover:text-white"
              }`}
            >
              <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Waveform Seek Row */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="w-9 text-right text-[11px] tabular-nums text-[#9aa6bc] sm:w-10 sm:text-xs">
              {formatTime(currentTime)}
            </span>
            <WaveformSeekBar
              seed={currentTrack.videoId}
              currentTime={currentTime}
              duration={effectiveDuration}
              onSeek={seekTo}
              bars={44}
              heightClass="h-6 sm:h-7"
            />
            <span className="w-9 text-[11px] tabular-nums text-[#9aa6bc] sm:w-10 sm:text-xs">
              {formatTime(effectiveDuration)}
            </span>
          </div>

          {/* Controls row (desktop includes track info on left & volume on right) */}
          <div className="flex items-center justify-center sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-3">
            {/* Desktop Left: Track info */}
            <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
              <div className="min-w-0">
                {currentTrack.albumId ? (
                  <Link
                    href={`/album/${encodeURIComponent(currentTrack.albumId)}`}
                    onClick={() => setIsExpanded(false)}
                    className="block truncate text-sm font-semibold text-white hover:text-[#38bdf8]"
                  >
                    {currentTrack.title}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-semibold text-white">
                    {currentTrack.title}
                  </p>
                )}
                <Link
                  href={
                    currentTrack.artistId
                      ? `/artist/${encodeURIComponent(currentTrack.artistId)}`
                      : `/?q=${encodeURIComponent(currentTrack.artist)}`
                  }
                  onClick={() => setIsExpanded(false)}
                  className="block truncate text-xs text-[#9aa6bc] hover:text-[#38bdf8]"
                >
                  {currentTrack.artist}
                </Link>
              </div>
              <button
                type="button"
                onClick={() => toggleLike(currentTrack)}
                aria-label={liked ? "Unlike" : "Like"}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  liked ? "text-[#38bdf8]" : "text-[#9aa6bc] hover:text-white"
                }`}
              >
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Center: Transport */}
            <div className="flex items-center justify-center gap-5 sm:gap-4">
              <button
                type="button"
                onClick={toggleShuffle}
                aria-label="Shuffle"
                className={
                  shuffle ? "text-[#38bdf8]" : "text-[#8f9bb0] hover:text-white"
                }
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={prevTrack}
                aria-label="Previous"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/[0.08]"
              >
                <SkipBack className="h-5 w-5 fill-current" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#38bdf8] text-[#07131a] transition-transform hover:scale-105 active:scale-95"
              >
                {isBuffering ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                )}
              </button>
              <button
                type="button"
                onClick={nextTrack}
                aria-label="Next"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/[0.08]"
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </button>
              <button
                type="button"
                onClick={cycleRepeat}
                aria-label="Repeat"
                className={
                  repeat !== "off"
                    ? "text-[#38bdf8]"
                    : "text-[#8f9bb0] hover:text-white"
                }
              >
                {repeat === "one" ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Right: Volume */}
            <div className="hidden items-center justify-end gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setVolume(volume > 0 ? 0 : 85)}
                aria-label="Mute"
                className="text-[#8f9bb0] hover:text-white"
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
                className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-white/15 accent-[#38bdf8]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
