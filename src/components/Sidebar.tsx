"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Disc3, Heart, Home, Library, Plus } from "lucide-react";
import { useState } from "react";
import { usePlayer } from "@/components/PlayerContext";

export function Sidebar() {
  const pathname = usePathname();
  const { likedTracks, recentTracks, playlists, createPlaylist } = usePlayer();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-2.5 lg:flex xl:w-72">
      {/* Top nav card */}
      <div className="glass-panel rounded-2xl p-3">
        <Link href="/" className="mb-3 flex items-center gap-2.5 px-2 py-1">
          <img
            src="/potato-mascot.svg"
            alt="PotatoMusic"
            className="h-7 w-7 rounded-full"
          />
          <span className="text-base font-bold tracking-tight text-white">
            Potato<span className="text-[#38bdf8]">Music</span>
          </span>
        </Link>

        <nav className="space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              pathname === "/"
                ? "bg-white/15 text-white"
                : "text-[#9aa6bc] hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          <Link
            href="/library"
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              pathname === "/library"
                ? "bg-white/15 text-white"
                : "text-[#9aa6bc] hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Library className="h-5 w-5" />
            <span>Your Library</span>
          </Link>
        </nav>
      </div>

      {/* Library & Playlists card */}
      <div className="glass-panel flex min-h-0 flex-1 flex-col rounded-2xl p-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#b3b3b3]">
            Playlists
          </span>
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            aria-label="Create playlist"
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#b3b3b3] transition-colors hover:bg-[#242424] hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {creating && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              createPlaylist(name);
              setName("");
              setCreating(false);
            }}
            className="mb-2 flex gap-1.5 px-1"
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Playlist name..."
              autoFocus
              className="h-8 min-w-0 flex-1 rounded-md bg-[#242424] px-2.5 text-xs text-white placeholder-[#888] focus:outline-none focus:ring-1 focus:ring-[#38bdf8]"
            />
            <button
              type="submit"
              className="h-8 rounded-md bg-[#38bdf8] px-2.5 text-xs font-semibold text-[#07131a]"
            >
              Add
            </button>
          </form>
        )}

        <div className="flex-1 space-y-1 overflow-y-auto">
          <Link
            href="/library?tab=liked"
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.08]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#38bdf8]/15 text-[#38bdf8]">
              <Heart className="h-4 w-4 fill-current" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                Liked Songs
              </p>
              <p className="text-xs text-[#9aa6bc]">
                {likedTracks.length} songs
              </p>
            </div>
          </Link>

          <Link
            href="/library?tab=recent"
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.08]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-[#c5d0e0]">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                Recently Played
              </p>
              <p className="text-xs text-[#9aa6bc]">
                {recentTracks.length} songs
              </p>
            </div>
          </Link>

          {playlists.map((pl) => (
            <Link
              key={pl.id}
              href={`/library?playlist=${encodeURIComponent(pl.id)}`}
              className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.08]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-[#c5d0e0]">
                <Disc3 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {pl.name}
                </p>
                <p className="text-xs text-[#9aa6bc]">
                  {pl.tracks.length} tracks
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
