"use client";

import { Check, ListPlus, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/components/PlayerContext";
import type { Track } from "@/lib/types";

interface AddToPlaylistButtonProps {
  track: Track;
  size?: "sm" | "md";
}

export function AddToPlaylistButton({
  track,
  size = "sm",
}: AddToPlaylistButtonProps) {
  const {
    playlists,
    createPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = usePlayer();

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const btnSize = size === "md" ? "h-10 w-10" : "h-8 w-8";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Add to playlist"
        title="Add to playlist"
        className={`flex ${btnSize} items-center justify-center rounded-full text-[#8f9bb0] transition-colors hover:bg-white/10 hover:text-white`}
      >
        <ListPlus className="h-4 w-4" />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="glass-panel absolute bottom-full right-0 z-50 mb-2 w-56 rounded-2xl bg-[#0a0f1a]/95 p-2.5"
        >
          <p className="mb-2 px-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9aa6bc]">
            Add to playlist
          </p>

          <div className="max-h-40 space-y-1 overflow-y-auto">
            {playlists.length === 0 ? (
              <p className="px-1.5 py-2 text-xs text-[#7c889e]">
                No playlists yet
              </p>
            ) : (
              playlists.map((pl) => {
                const inPl = pl.tracks.some((t) => t.videoId === track.videoId);
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => {
                      if (inPl) {
                        removeTrackFromPlaylist(pl.id, track.videoId);
                      } else {
                        addTrackToPlaylist(pl.id, track);
                      }
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-white transition-colors hover:bg-white/10"
                  >
                    <span className="truncate">{pl.name}</span>
                    {inPl && <Check className="h-3.5 w-3.5 shrink-0 text-[#38bdf8]" />}
                  </button>
                );
              })
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newName.trim()) return;
              const pl = createPlaylist(newName);
              addTrackToPlaylist(pl.id, track);
              setNewName("");
            }}
            className="mt-2 flex gap-1.5 border-t border-white/10 pt-2"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New playlist..."
              className="h-7 min-w-0 flex-1 rounded-lg bg-white/[0.08] px-2 text-xs text-white placeholder-[#7c889e] focus:outline-none focus:ring-1 focus:ring-[#38bdf8]"
            />
            <button
              type="submit"
              aria-label="Create and add"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#38bdf8] text-[#07131a]"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
