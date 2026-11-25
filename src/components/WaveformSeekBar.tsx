"use client";

import { useMemo } from "react";

interface WaveformSeekBarProps {
  seed: string;
  currentTime: number;
  duration: number;
  disabled?: boolean;
  onSeek: (seconds: number) => void;
  bars?: number;
  heightClass?: string;
}

export function WaveformSeekBar({
  seed,
  currentTime,
  duration,
  disabled = false,
  onSeek,
  bars = 44,
  heightClass = "h-6",
}: WaveformSeekBarProps) {
  const heights = useMemo(() => {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const list: number[] = [];
    for (let i = 0; i < bars; i++) {
      hash ^= i + 1;
      hash = Math.imul(hash, 16777619);
      const norm = ((hash >>> 0) % 100) / 100;
      // Shape slightly fuller in the middle like a real song envelope
      const env = 0.55 + 0.45 * Math.sin((i / (bars - 1)) * Math.PI);
      list.push(Math.max(20, Math.round((25 + norm * 75) * env)));
    }
    return list;
  }, [seed, bars]);

  const effectiveDuration = duration > 0 ? duration : 1;
  const progress = Math.max(0, Math.min(1, currentTime / effectiveDuration));

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width)
    );
    onSeek(ratio * duration);
  }

  return (
    <div
      role="slider"
      aria-label="Seek waveform"
      aria-valuemin={0}
      aria-valuemax={Math.round(effectiveDuration)}
      aria-valuenow={Math.round(currentTime)}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      className={`group flex flex-1 items-center gap-[2px] ${heightClass} ${
        disabled ? "cursor-default opacity-40" : "cursor-pointer"
      }`}
    >
      {heights.map((h, idx) => {
        const barRatio = (idx + 0.5) / bars;
        const filled = barRatio <= progress;
        return (
          <span
            key={idx}
            className={`flex-1 rounded-full transition-colors duration-150 ${
              filled
                ? "bg-[#38bdf8]"
                : "bg-white/20 group-hover:bg-white/35"
            }`}
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
}
