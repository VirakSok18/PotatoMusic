"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EqualizerBars } from "@/components/EqualizerBars";
import { usePlayer } from "@/components/PlayerContext";
import { formatTime } from "@/lib/storage";
import type { LyricLine } from "@/lib/types";

export function HomeQueuePanel() {
  const {
    queue,
    currentIndex,
    isPlaying,
    playTrack,
    removeFromQueue,
  } = usePlayer();

  return (
    <aside className="fixed bottom-24 left-4 top-24 z-20 hidden w-72 flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025] 2xl:flex">
      <div className="border-b border-white/[0.05] px-4 py-3">
        <h3 className="text-sm font-bold text-white">Up Next</h3>
        <p className="text-[11px] text-[#9aa6bc]">
          {queue.length} {queue.length === 1 ? "song" : "songs"} in queue
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {queue.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-[#7c889e]">
            Play any song to build your queue.
          </div>
        ) : (
          <div className="space-y-1">
            {queue.map((item, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <div
                  key={`${item.videoId}-${idx}`}
                  className={`group flex items-center gap-2 rounded-xl p-1.5 transition-colors ${
                    isCurrent
                      ? "bg-[#38bdf8]/15"
                      : "hover:bg-white/[0.06]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => playTrack(item, queue)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <img
                      src={
                        item.artwork ||
                        `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`
                      }
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="h-9 w-9 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-semibold ${
                          isCurrent ? "text-[#38bdf8]" : "text-white"
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="truncate text-[11px] text-[#9aa6bc]">
                        {item.artist}
                      </p>
                    </div>
                  </button>

                  {isCurrent ? (
                    <EqualizerBars playing={isPlaying} className="mr-1 shrink-0" />
                  ) : (
                    <span className="text-[10px] tabular-nums text-[#7c889e] group-hover:hidden">
                      {formatTime(item.duration)}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFromQueue(idx)}
                    aria-label="Remove from queue"
                    className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#8f9bb0] hover:bg-white/10 hover:text-white group-hover:flex"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

export function HomeLyricsPanel() {
  const { currentTrack, currentTime, seekTo } = usePlayer();
  const [synced, setSynced] = useState<LyricLine[]>([]);
  const [plain, setPlain] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!currentTrack) {
      setSynced([]);
      setPlain(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setSynced([]);
    setPlain(null);

    const params = new URLSearchParams({
      title: currentTrack.title,
      artist: currentTrack.artist,
      duration: String(currentTrack.duration || 0),
    });

    fetch(`/api/lyrics?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { synced?: LyricLine[]; plain?: string | null }) => {
        if (cancelled) return;
        setSynced(data.synced || []);
        setPlain(data.plain || null);
      })
      .catch(() => {
        if (!cancelled) {
          setSynced([]);
          setPlain(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentTrack?.videoId]);

  const activeIdx = synced.reduce((acc, line, idx) => {
    if (line.time <= currentTime + 0.3) return idx;
    return acc;
  }, -1);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeIdx]);

  return (
    <aside className="fixed bottom-24 right-4 top-24 z-20 hidden w-72 flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025] 2xl:flex">
      <div className="border-b border-white/[0.05] px-4 py-3">
        <h3 className="text-sm font-bold text-white">Lyrics</h3>
        <p className="truncate text-[11px] text-[#9aa6bc]">
          {currentTrack
            ? `${currentTrack.title} · ${currentTrack.artist}`
            : "No song playing"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!currentTrack ? (
          <div className="flex h-full items-center justify-center text-center text-xs text-[#7c889e]">
            Play a track to see live synced lyrics here.
          </div>
        ) : loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-[#9aa6bc]">
            <Loader2 className="h-4 w-4 animate-spin text-[#38bdf8]" />
            <span>Loading lyrics...</span>
          </div>
        ) : synced.length > 0 ? (
          <div className="space-y-3 py-4">
            {synced.map((line, idx) => {
              const isActive = idx === activeIdx;
              return (
                <button
                  key={`${line.time}-${idx}`}
                  ref={isActive ? activeRef : null}
                  type="button"
                  onClick={() => seekTo(line.time)}
                  className={`block w-full text-left text-sm font-semibold leading-snug transition-colors ${
                    isActive
                      ? "text-[#38bdf8]"
                      : idx < activeIdx
                      ? "text-white/35 hover:text-white/70"
                      : "text-white/65 hover:text-white"
                  }`}
                >
                  {line.text}
                </button>
              );
            })}
          </div>
        ) : plain ? (
          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#c5d0e0]">
            {plain}
          </pre>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-xs text-[#7c889e]">
            No lyrics found for this track.
          </div>
        )}
      </div>
    </aside>
  );
}
