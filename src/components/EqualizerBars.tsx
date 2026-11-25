"use client";

interface EqualizerBarsProps {
  playing: boolean;
  className?: string;
}

export function EqualizerBars({ playing, className = "" }: EqualizerBarsProps) {
  const delays = ["0ms", "180ms", "340ms", "120ms"];
  const durations = ["0.75s", "0.95s", "0.68s", "0.85s"];

  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-3.5 items-end gap-[2px] ${className}`}
    >
      {delays.map((delay, i) => (
        <span
          key={i}
          className="eq-bar h-full w-[2.5px] rounded-full bg-[#38bdf8]"
          style={{
            animationDelay: delay,
            animationDuration: durations[i],
            animationPlayState: playing ? "running" : "paused",
            transform: playing ? undefined : "scaleY(0.28)",
          }}
        />
      ))}
    </span>
  );
}
