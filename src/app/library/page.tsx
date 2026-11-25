"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Play, Shuffle } from "lucide-react";
import { TabBar } from "glisse";
import { Suspense, useEffect, useState } from "react";
import { usePlayer } from "@/components/PlayerContext";
import { VinylCard } from "@/components/VinylCard";
import type { Track } from "@/lib/types";

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");

  const { playAll, setIsExpanded, likedTracks, recentTracks } = usePlayer();
  const [tab, setTab] = useState<"recent" | "liked">("recent");

  useEffect(() => {
    if (urlTab === "liked" || urlTab === "recent") {
      setTab(urlTab);
    }
  }, [urlTab]);

  const tabItems = [
    { value: "recent", label: "Recent" },
    { value: "liked", label: "Liked" },
  ];

  function renderActionBar(tracks: Track[]) {
    if (tracks.length === 0) return null;
    return (
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            playAll(tracks, false);
            setIsExpanded(true);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#38bdf8] px-5 text-xs font-semibold text-[#07131a]"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Play All</span>
        </button>
        <button
          type="button"
          onClick={() => {
            playAll(tracks, true);
            setIsExpanded(true);
          }}
          className="glass-pill inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-semibold text-white hover:bg-white/[0.12]"
        >
          <Shuffle className="h-3.5 w-3.5 text-[#38bdf8]" />
          <span>Shuffle</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Your Library
          </h1>
          <p className="mt-1 text-sm text-[#9aa6bc]">
            Recent plays and liked songs saved on this device
          </p>
        </div>

        <TabBar
          items={tabItems}
          value={tab}
          onValueChange={(val) => {
            const next = val as "recent" | "liked";
            setTab(next);
            router.replace(`/library?tab=${next}`);
          }}
          aria-label="Library sections"
        />
      </div>

      {tab === "recent" && (
        <>
          {renderActionBar(recentTracks)}
          {recentTracks.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-sm text-[#9aa6bc]">
              Nothing played yet. Play a track from Home or Explore to see it
              here.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {recentTracks.map((track) => (
                <VinylCard
                  key={track.videoId}
                  track={track}
                  queue={recentTracks}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "liked" && (
        <>
          {renderActionBar(likedTracks)}
          {likedTracks.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-sm text-[#9aa6bc]">
              No liked songs yet. Tap the heart on any track to save it here.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {likedTracks.map((track) => (
                <VinylCard
                  key={track.videoId}
                  track={track}
                  queue={likedTracks}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={null}>
      <LibraryContent />
    </Suspense>
  );
}
