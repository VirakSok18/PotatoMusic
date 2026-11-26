"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getLikedTracks,
  getPlayerPrefs,
  getPlaylists,
  getRecentTracks,
  getSavedSession,
  saveLikedTracks,
  savePlayerPrefs,
  savePlaylists,
  saveRecentTracks,
  saveSession,
} from "@/lib/storage";
import type { Playlist, Track } from "@/lib/types";

interface YTPlayerInstance {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void;
  setPlaybackQuality?: (suggestedQuality: string) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        config: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayerInstance }) => void;
            onStateChange?: (e: { data: number }) => void;
            onError?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface PlayerContextValue {
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  sleepTimer: number | "end" | null;
  setSleepTimer: (mode: number | "end" | null) => void;
  isExpanded: boolean;
  setIsExpanded: (open: boolean) => void;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  playAll: (tracks: Track[], shuffleMode?: boolean) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  showToast: (message: string) => void;
  likedTracks: Track[];
  recentTracks: Track[];
  playlists: Playlist[];
  isLiked: (videoId: string) => boolean;
  toggleLike: (track: Track) => void;
  createPlaylist: (name: string) => Playlist;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, videoId: string) => void;
  deletePlaylist: (playlistId: string) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(85);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
  const [sleepTimer, setSleepTimerState] = useState<number | "end" | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const playerRef = useRef<YTPlayerInstance | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerReadyRef = useRef(false);
  const pendingVideoIdRef = useRef<string | null>(null);
  const loadedVideoIdRef = useRef<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepTimerRef = useRef<number | "end" | null>(null);
  const lastVolumeRef = useRef(85);
  const radioFetchingForRef = useRef<string | null>(null);

  const queueRef = useRef(queue);
  const indexRef = useRef(currentIndex);
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);
  const isPlayingRef = useRef(isPlaying);
  const volumeRef = useRef(volume);

  queueRef.current = queue;
  indexRef.current = currentIndex;
  shuffleRef.current = shuffle;
  repeatRef.current = repeat;
  isPlayingRef.current = isPlaying;
  volumeRef.current = volume;

  const currentTrack =
    currentIndex >= 0 && currentIndex < queue.length
      ? queue[currentIndex]
      : null;

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const prefsLoadedRef = useRef(false);

  useEffect(() => {
    setLikedTracks(getLikedTracks());
    setRecentTracks(getRecentTracks());
    setPlaylists(getPlaylists());
    const prefs = getPlayerPrefs();
    setVolumeState(prefs.volume);
    volumeRef.current = prefs.volume;
    if (prefs.volume > 0) lastVolumeRef.current = prefs.volume;
    setRepeat(prefs.repeat);
    setShuffle(prefs.shuffle);
    prefsLoadedRef.current = true;
    if (playerReadyRef.current && playerRef.current) {
      playerRef.current.setVolume(prefs.volume);
    }
    const saved = getSavedSession();
    if (saved && saved.queue.length > 0) {
      const idx = Math.max(0, Math.min(saved.currentIndex, saved.queue.length - 1));
      setQueue(saved.queue);
      setCurrentIndex(idx);
      setDuration(saved.queue[idx]?.duration || 0);
    }
  }, []);

  useEffect(() => {
    if (!prefsLoadedRef.current) return;
    savePlayerPrefs({ volume, repeat, shuffle });
  }, [volume, repeat, shuffle]);

  useEffect(() => {
    if (queue.length > 0 && currentIndex >= 0) {
      saveSession({ queue, currentIndex });
    }
  }, [queue, currentIndex]);

  // Proactive Endless Radio: when within 2 tracks of the end of the queue,
  // automatically fetch related songs in the background so playback never stops.
  useEffect(() => {
    if (repeat !== "off") return;
    if (queue.length === 0 || currentIndex < 0) return;
    if (currentIndex < queue.length - 2) return;

    const seedTrack = queue[queue.length - 1];
    if (!seedTrack || radioFetchingForRef.current === seedTrack.videoId) return;
    radioFetchingForRef.current = seedTrack.videoId;

    const params = new URLSearchParams({
      videoId: seedTrack.videoId,
      artist: seedTrack.artist,
    });

    fetch(`/api/radio?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { tracks?: Track[] }) => {
        const existing = new Set(queueRef.current.map((t) => t.videoId));
        const fresh = (data.tracks || []).filter(
          (t) => !existing.has(t.videoId)
        );
        if (fresh.length > 0) {
          const batch = fresh.slice(0, 13);
          setQueue((prev) => [...prev, ...batch]);
          if (queueRef.current.length > 1) {
            showToast(`Added ${batch.length} more songs to queue`);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (radioFetchingForRef.current === seedTrack.videoId) {
          radioFetchingForRef.current = null;
        }
      });
  }, [currentIndex, queue, repeat]);

  const setSleepTimer = useCallback(
    (mode: number | "end" | null) => {
      if (sleepTimeoutRef.current) {
        clearTimeout(sleepTimeoutRef.current);
        sleepTimeoutRef.current = null;
      }
      sleepTimerRef.current = mode;
      setSleepTimerState(mode);
      if (mode === null) {
        showToast("Sleep timer off");
      } else if (mode === "end") {
        showToast("Will pause after this song");
      } else {
        showToast(`Sleep timer set for ${mode} min`);
        sleepTimeoutRef.current = setTimeout(() => {
          playerRef.current?.pauseVideo();
          setIsPlaying(false);
          sleepTimerRef.current = null;
          setSleepTimerState(null);
          showToast("Sleep timer paused playback");
        }, mode * 60 * 1000);
      }
    },
    [showToast]
  );

  const recordRecent = useCallback((track: Track) => {
    setRecentTracks((prev) => {
      const next = [
        track,
        ...prev.filter((t) => t.videoId !== track.videoId),
      ].slice(0, 30);
      saveRecentTracks(next);
      return next;
    });
  }, []);

  const loadVideo = useCallback((videoId: string) => {
    setCurrentTime(0);
    setIsBuffering(true);
    loadedVideoIdRef.current = videoId;
    if (playerReadyRef.current && playerRef.current) {
      playerRef.current.loadVideoById(videoId);
      playerRef.current.playVideo();
    } else {
      pendingVideoIdRef.current = videoId;
    }
  }, []);

  const nextTrack = useCallback(() => {
    const q = queueRef.current;
    if (q.length === 0) return;

    let nextIdx = indexRef.current + 1;
    if (shuffleRef.current && q.length > 1) {
      let rand = Math.floor(Math.random() * q.length);
      if (rand === indexRef.current) rand = (rand + 1) % q.length;
      nextIdx = rand;
    } else if (nextIdx >= q.length) {
      if (repeatRef.current === "all") {
        nextIdx = 0;
      } else {
        // Auto-Play Radio: fetch related tracks when queue ends
        const lastTrack = q[indexRef.current];
        if (!lastTrack) {
          setIsPlaying(false);
          return;
        }
        fetch(`/api/radio?videoId=${encodeURIComponent(lastTrack.videoId)}`)
          .then((r) => r.json())
          .then((data: { tracks?: Track[] }) => {
            const existing = new Set(queueRef.current.map((t) => t.videoId));
            const fresh = (data.tracks || []).filter(
              (t) => !existing.has(t.videoId)
            );
            if (fresh.length === 0) {
              setIsPlaying(false);
              return;
            }
            const nextQueue = [...queueRef.current, ...fresh];
            const radioIdx = queueRef.current.length;
            setQueue(nextQueue);
            setCurrentIndex(radioIdx);
            setDuration(fresh[0].duration || 0);
            recordRecent(fresh[0]);
            loadVideo(fresh[0].videoId);
            showToast("Auto-playing similar tracks");
          })
          .catch(() => setIsPlaying(false));
        return;
      }
    }

    setCurrentIndex(nextIdx);
    const next = q[nextIdx];
    if (next) {
      setDuration(next.duration || 0);
      recordRecent(next);
      loadVideo(next.videoId);
    }
  }, [loadVideo, recordRecent, showToast]);

  const prevTrack = useCallback(() => {
    const q = queueRef.current;
    if (q.length === 0) return;

    if (
      playerReadyRef.current &&
      playerRef.current &&
      playerRef.current.getCurrentTime() > 4
    ) {
      playerRef.current.seekTo(0, true);
      setCurrentTime(0);
      return;
    }

    const prevIdx =
      indexRef.current > 0 ? indexRef.current - 1 : q.length - 1;
    setCurrentIndex(prevIdx);
    const prev = q[prevIdx];
    if (prev) {
      setDuration(prev.duration || 0);
      recordRecent(prev);
      loadVideo(prev.videoId);
    }
  }, [loadVideo, recordRecent]);

  // Mount YouTube IFrame API once
  useEffect(() => {
    let cancelled = false;

    const initPlayer = () => {
      if (cancelled || !playerContainerRef.current || !window.YT?.Player) return;
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        height: "200",
        width: "200",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (e) => {
            playerReadyRef.current = true;
            e.target.setVolume(volumeRef.current);
            if (pendingVideoIdRef.current) {
              const vid = pendingVideoIdRef.current;
              pendingVideoIdRef.current = null;
              e.target.loadVideoById(vid);
              e.target.playVideo();
            }
          },
          onStateChange: (e) => {
            const state = e.data;
            if (state === 1) {
              setIsPlaying(true);
              setIsBuffering(false);
              // Drop hidden video decode to lowest resolution to save GPU while gaming
              playerRef.current?.setPlaybackQuality?.("small");
              const d = playerRef.current?.getDuration() || 0;
              if (d > 0) setDuration(d);
            } else if (state === 2) {
              setIsPlaying(false);
              setIsBuffering(false);
            } else if (state === 3) {
              setIsBuffering(true);
            } else if (state === 0) {
              if (sleepTimerRef.current === "end") {
                sleepTimerRef.current = null;
                setSleepTimerState(null);
                setIsPlaying(false);
                showToast("Sleep timer paused playback");
                return;
              }
              if (repeatRef.current === "one") {
                playerRef.current?.seekTo(0, true);
                playerRef.current?.playVideo();
              } else {
                nextTrack();
              }
            }
          },
          onError: () => {
            setIsBuffering(false);
            setIsPlaying(false);
            if (queueRef.current.length > 1) {
              showToast("Track unavailable for web playback, skipping...");
              setTimeout(() => nextTrack(), 900);
            } else {
              showToast("This track cannot be embedded");
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        initPlayer();
      };
      if (
        !document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]'
        )
      ) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [nextTrack, showToast]);

  // Pause GPU animations & React time-polling when tab is hidden (e.g. while gaming)
  useEffect(() => {
    const syncVisibility = () => {
      const hidden = document.hidden;
      document.documentElement.classList.toggle("tab-hidden", hidden);
      if (!hidden && playerReadyRef.current && playerRef.current) {
        const t = playerRef.current.getCurrentTime();
        if (Number.isFinite(t)) setCurrentTime(t);
      }
    };
    syncVisibility();
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  // Poll playback time smoothly for seek bar + synced lyrics (skipped when tab is hidden)
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      if (!playerReadyRef.current || !playerRef.current) return;
      if (!isPlaying) return;
      const t = playerRef.current.getCurrentTime();
      if (Number.isFinite(t)) setCurrentTime(t);
      const d = playerRef.current.getDuration();
      if (Number.isFinite(d) && d > 0) setDuration(d);
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Global keyboard shortcuts (Space, ArrowLeft/Right, M, Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (e.key === "Escape") {
        setIsExpanded(false);
        return;
      }

      if (isInput) return;

      if (e.code === "Space" && queueRef.current.length > 0) {
        e.preventDefault();
        const cur =
          indexRef.current >= 0 ? queueRef.current[indexRef.current] : null;
        if (!cur) return;
        if (
          !playerReadyRef.current ||
          !playerRef.current ||
          loadedVideoIdRef.current !== cur.videoId
        ) {
          loadVideo(cur.videoId);
        } else if (isPlayingRef.current) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
      } else if (e.key === "ArrowRight" && playerReadyRef.current && playerRef.current) {
        const t = playerRef.current.getCurrentTime() + 5;
        playerRef.current.seekTo(t, true);
        setCurrentTime(t);
      } else if (e.key === "ArrowLeft" && playerReadyRef.current && playerRef.current) {
        const t = Math.max(0, playerRef.current.getCurrentTime() - 5);
        playerRef.current.seekTo(t, true);
        setCurrentTime(t);
      } else if (e.key.toLowerCase() === "m") {
        if (volumeRef.current > 0) {
          lastVolumeRef.current = volumeRef.current;
          setVolumeState(0);
          playerRef.current?.setVolume(0);
        } else {
          const restore = lastVolumeRef.current || 85;
          setVolumeState(restore);
          playerRef.current?.setVolume(restore);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Update Media Session metadata for lock-screen / OS media controls
  useEffect(() => {
    if (
      !currentTrack ||
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator)
    ) {
      return;
    }
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || "PotatoMusic",
        artwork: currentTrack.artwork
          ? [{ src: currentTrack.artwork, sizes: "512x512", type: "image/jpeg" }]
          : [],
      });
      navigator.mediaSession.setActionHandler("play", () => {
        playerRef.current?.playVideo();
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        playerRef.current?.pauseVideo();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => nextTrack());
      navigator.mediaSession.setActionHandler("previoustrack", () => prevTrack());
    } catch {
      // ignore unsupported browsers
    }
  }, [currentTrack, nextTrack, prevTrack]);

  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      if (newQueue && newQueue.length > 0) {
        const idx = newQueue.findIndex((t) => t.videoId === track.videoId);
        if (idx >= 0) {
          setQueue(newQueue);
          setCurrentIndex(idx);
        } else {
          setQueue([track, ...newQueue]);
          setCurrentIndex(0);
        }
      } else {
        setQueue((prev) => {
          const existingIdx = prev.findIndex((t) => t.videoId === track.videoId);
          if (existingIdx >= 0) {
            setCurrentIndex(existingIdx);
            return prev;
          }
          const next = [track, ...prev];
          setCurrentIndex(0);
          return next;
        });
      }
      setDuration(track.duration || 0);
      recordRecent(track);
      loadVideo(track.videoId);
    },
    [loadVideo, recordRecent]
  );

  const playAll = useCallback(
    (tracks: Track[], shuffleMode = false) => {
      if (tracks.length === 0) return;
      const list = shuffleMode
        ? [...tracks].sort(() => Math.random() - 0.5)
        : [...tracks];
      setShuffle(shuffleMode);
      setQueue(list);
      setCurrentIndex(0);
      setDuration(list[0].duration || 0);
      recordRecent(list[0]);
      loadVideo(list[0].videoId);
    },
    [loadVideo, recordRecent]
  );

  const addToQueue = useCallback(
    (track: Track) => {
      const exists = queueRef.current.some((t) => t.videoId === track.videoId);
      if (exists) {
        showToast("Already in queue");
        return;
      }
      setQueue((prev) => [...prev, track]);
      showToast(`Added "${track.title}" to queue`);
    },
    [showToast]
  );

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const next = prev.filter((_, i) => i !== index);
      if (index < indexRef.current) {
        setCurrentIndex((ci) => Math.max(0, ci - 1));
      } else if (index === indexRef.current) {
        if (next.length === 0) {
          setCurrentIndex(-1);
          setIsPlaying(false);
          playerRef.current?.pauseVideo();
        } else {
          const nextIdx = Math.min(index, next.length - 1);
          setCurrentIndex(nextIdx);
          loadVideo(next[nextIdx].videoId);
        }
      }
      return next;
    });
  }, [loadVideo]);

  const clearQueue = useCallback(() => {
    const cur =
      indexRef.current >= 0 ? queueRef.current[indexRef.current] : null;
    if (cur) {
      setQueue([cur]);
      setCurrentIndex(0);
      showToast("Cleared upcoming queue");
    } else {
      setQueue([]);
      setCurrentIndex(-1);
    }
  }, [showToast]);

  const togglePlay = useCallback(() => {
    const cur =
      indexRef.current >= 0 ? queueRef.current[indexRef.current] : null;
    if (!cur) return;
    if (!playerReadyRef.current || !playerRef.current) {
      loadVideo(cur.videoId);
      return;
    }
    if (loadedVideoIdRef.current !== cur.videoId) {
      loadVideo(cur.videoId);
      return;
    }
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying, loadVideo]);

  const seekTo = useCallback((seconds: number) => {
    if (!playerReadyRef.current || !playerRef.current) return;
    playerRef.current.seekTo(seconds, true);
    setCurrentTime(seconds);
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, vol));
    setVolumeState(clamped);
    if (clamped > 0) lastVolumeRef.current = clamped;
    if (playerReadyRef.current && playerRef.current) {
      playerRef.current.setVolume(clamped);
    }
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(() => {
    setRepeat((r) => {
      const next = r === "off" ? "all" : r === "all" ? "one" : "off";
      showToast(
        next === "off"
          ? "Loop off · Auto-Radio on"
          : next === "all"
          ? "Looping current queue"
          : "Looping current song"
      );
      return next;
    });
  }, [showToast]);

  const isLiked = useCallback(
    (videoId: string) => likedTracks.some((t) => t.videoId === videoId),
    [likedTracks]
  );

  const toggleLike = useCallback(
    (track: Track) => {
      setLikedTracks((prev) => {
        const exists = prev.some((t) => t.videoId === track.videoId);
        const next = exists
          ? prev.filter((t) => t.videoId !== track.videoId)
          : [track, ...prev];
        saveLikedTracks(next);
        showToast(exists ? "Removed from Liked Songs" : "Saved to Liked Songs");
        return next;
      });
    },
    [showToast]
  );

  const createPlaylist = useCallback(
    (name: string): Playlist => {
      const pl: Playlist = {
        id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim() || "Untitled Playlist",
        createdAt: Date.now(),
        tracks: [],
      };
      setPlaylists((prev) => {
        const next = [pl, ...prev];
        savePlaylists(next);
        return next;
      });
      showToast(`Created "${pl.name}"`);
      return pl;
    },
    [showToast]
  );

  const addTrackToPlaylist = useCallback(
    (playlistId: string, track: Track) => {
      setPlaylists((prev) => {
        let addedName = "";
        const next = prev.map((pl) => {
          if (pl.id !== playlistId) return pl;
          addedName = pl.name;
          if (pl.tracks.some((t) => t.videoId === track.videoId)) return pl;
          return { ...pl, tracks: [...pl.tracks, track] };
        });
        savePlaylists(next);
        if (addedName) showToast(`Added to "${addedName}"`);
        return next;
      });
    },
    [showToast]
  );

  const removeTrackFromPlaylist = useCallback(
    (playlistId: string, videoId: string) => {
      setPlaylists((prev) => {
        const next = prev.map((pl) =>
          pl.id === playlistId
            ? { ...pl, tracks: pl.tracks.filter((t) => t.videoId !== videoId) }
            : pl
        );
        savePlaylists(next);
        return next;
      });
    },
    []
  );

  const deletePlaylist = useCallback(
    (playlistId: string) => {
      setPlaylists((prev) => {
        const next = prev.filter((pl) => pl.id !== playlistId);
        savePlaylists(next);
        return next;
      });
      showToast("Playlist deleted");
    },
    [showToast]
  );

  return (
    <PlayerContext.Provider
      value={{
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
        sleepTimer,
        setSleepTimer,
        isExpanded,
        setIsExpanded,
        playTrack,
        playAll,
        addToQueue,
        removeFromQueue,
        clearQueue,
        togglePlay,
        seekTo,
        nextTrack,
        prevTrack,
        setVolume,
        toggleShuffle,
        cycleRepeat,
        showToast,
        likedTracks,
        recentTracks,
        playlists,
        isLiked,
        toggleLike,
        createPlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        deletePlaylist,
      }}
    >
      {children}

      {/* Liquid Glass Toast Notification (drops down below top bar & swooshes back up) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: -28, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -28, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-none fixed left-1/2 top-20 z-[60] -translate-x-1/2"
          >
            <div className="glass-panel rounded-full bg-[#111114]/90 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xl">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent YouTube IFrame audio engine (above body bg with 0.01 opacity so Chrome occlusion doesn't pause it) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 z-0 h-[200px] w-[200px] overflow-hidden opacity-[0.01]"
      >
        <div ref={playerContainerRef} />
      </div>
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
