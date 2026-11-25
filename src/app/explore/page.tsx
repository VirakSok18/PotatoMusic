"use client";

import { Play, Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlayer } from "@/components/PlayerContext";
import { VinylCard } from "@/components/VinylCard";
import type { Track } from "@/lib/types";

const MOODS = [
  {
    id: "pop",
    label: "Pop",
    tagline: "Chart-topping anthems",
    query: "top pop songs 2025",
    gradient: "from-sky-500/35 to-blue-900/40",
  },
  {
    id: "kpop",
    label: "K-Pop",
    tagline: "Seoul's freshest drops",
    query: "kpop hits 2025",
    gradient: "from-pink-500/35 to-purple-900/40",
  },
  {
    id: "hiphop",
    label: "Hip-Hop",
    tagline: "Heavy beats & bars",
    query: "top hip hop rap songs 2025",
    gradient: "from-amber-500/35 to-orange-950/40",
  },
  {
    id: "anime",
    label: "Anime OST",
    tagline: "Openings & soundtracks",
    query: "best anime opening songs",
    gradient: "from-indigo-500/35 to-slate-900/40",
  },
  {
    id: "rnb",
    label: "R&B",
    tagline: "Smooth vocals & grooves",
    query: "smooth rnb songs",
    gradient: "from-rose-500/35 to-fuchsia-950/40",
  },
  {
    id: "lofi",
    label: "Lo-Fi & Chill",
    tagline: "Late night study vibes",
    query: "lofi chill beats study",
    gradient: "from-teal-500/35 to-emerald-950/40",
  },
  {
    id: "indie",
    label: "Indie",
    tagline: "Alt-pop & bedroom rock",
    query: "indie pop rock favorites",
    gradient: "from-violet-500/35 to-indigo-950/40",
  },
  {
    id: "edm",
    label: "Electronic",
    tagline: "Club & synth energy",
    query: "electronic dance hits",
    gradient: "from-cyan-500/35 to-blue-950/40",
  },
];

const moodCache = new Map<string, Track[]>();

export default function ExplorePage() {
  const { playAll, setIsExpanded } = usePlayer();
  const [activeMood, setActiveMood] = useState(MOODS[0]);
  const [tracks, setTracks] = useState<Track[]>(
    () => moodCache.get(MOODS[0].id) || []
  );
  const [loading, setLoading] = useState(() => !moodCache.has(MOODS[0].id));

  useEffect(() => {
    const cached = moodCache.get(activeMood.id);
    if (cached) {
      setTracks(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(activeMood.query)}`)
      .then((r) => r.json())
      .then((data: { tracks?: Track[] }) => {
        if (cancelled) return;
        const clean = (data.tracks || []).filter(
          (t) => t.duration === 0 || t.duration <= 600
        );
        moodCache.set(activeMood.id, clean);
        setTracks(clean);
      })
      .catch(() => {
        if (!cancelled) setTracks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeMood]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Explore
        </h1>
        <p className="mt-1 text-sm text-[#9aa6bc]">
          Browse by genre and mood
        </p>
      </div>

      {/* Visual Genre & Mood Tiles */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MOODS.map((mood) => {
          const isActive = mood.id === activeMood.id;
          return (
            <button
              key={mood.id}
              type="button"
              onClick={() => setActiveMood(mood)}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 text-left transition-all ${
                mood.gradient
              } ${
                isActive
                  ? "border-[#38bdf8] ring-1 ring-[#38bdf8]/50"
                  : "border-white/10 hover:border-white/25"
              }`}
            >
              <p className="text-base font-bold text-white">{mood.label}</p>
              <p className="mt-0.5 text-xs text-white/70">{mood.tagline}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Genre Header + Play All / Shuffle */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {activeMood.label}
          </h2>
          <p className="text-xs text-[#9aa6bc]">{activeMood.tagline}</p>
        </div>

        {!loading && tracks.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                playAll(tracks, false);
                setIsExpanded(true);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#38bdf8] px-4 text-xs font-semibold text-[#07131a]"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Play All</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playAll(tracks, true);
                setIsExpanded(true);
              }}
              className="glass-pill inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-semibold text-white hover:bg-white/[0.12]"
            >
              <Shuffle className="h-3.5 w-3.5 text-[#38bdf8]" />
              <span>Shuffle</span>
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="glass-card animate-pulse rounded-2xl p-3.5">
              <div className="mb-3.5 aspect-[4/3] w-full rounded-xl bg-white/[0.08]" />
              <div className="h-4 w-3/4 rounded bg-white/[0.09]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-sm text-[#9aa6bc]">
          No tracks found for {activeMood.label}.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {tracks.map((track) => (
            <VinylCard key={track.videoId} track={track} queue={tracks} />
          ))}
        </div>
      )}
    </div>
  );
}
