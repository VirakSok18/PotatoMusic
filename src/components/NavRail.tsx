"use client";

import { usePathname, useRouter } from "next/navigation";
import { Compass, Home, Library } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/library", label: "Library", icon: Library },
];

const ITEM_HEIGHT = 62;
const ITEM_GAP = 6;
const STEP = ITEM_HEIGHT + ITEM_GAP;

function getActiveIndex(pathname: string): number {
  if (pathname.startsWith("/explore")) return 1;
  if (pathname.startsWith("/library")) return 2;
  return 0;
}

export function NavRail() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(() =>
    getActiveIndex(pathname)
  );
  const [dragging, setDragging] = useState(false);
  const [dragY, setDragY] = useState<number | null>(null);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragIndexRef = useRef<number>(activeIndex);

  useEffect(() => {
    setActiveIndex(getActiveIndex(pathname));
  }, [pathname]);

  useEffect(() => {
    NAV_ITEMS.forEach((item) => router.prefetch(item.href));
  }, [router]);

  function indexFromClientY(clientY: number): { idx: number; clampedY: number } {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return { idx: activeIndex, clampedY: activeIndex * STEP };
    const maxY = (NAV_ITEMS.length - 1) * STEP;
    const rawY = clientY - rect.top - ITEM_HEIGHT / 2;
    const clampedY = Math.max(0, Math.min(maxY, rawY));
    const idx = Math.round(clampedY / STEP);
    return { idx, clampedY };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { idx, clampedY } = indexFromClientY(e.clientY);
    setDragging(true);
    setDragY(clampedY);
    dragIndexRef.current = idx;
    setActiveIndex(idx);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const { idx, clampedY } = indexFromClientY(e.clientY);
    setDragY(clampedY);
    if (idx !== dragIndexRef.current) {
      dragIndexRef.current = idx;
      setActiveIndex(idx);
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    const targetIdx = dragIndexRef.current;
    setDragging(false);
    setDragY(null);
    setActiveIndex(targetIdx);
    const target = NAV_ITEMS[targetIdx];
    if (target && target.href !== pathname) {
      router.push(target.href);
    }
  }

  const thumbY = dragging && dragY !== null ? dragY : activeIndex * STEP;

  return (
    <aside
      aria-label="Primary navigation"
      className="fixed left-[max(1.5rem,calc((100vw-80rem)/4))] top-1/2 z-30 hidden -translate-y-1/2 select-none rounded-full border border-white/20 bg-white/[0.08] p-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.28),0_14px_36px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:block"
    >
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex cursor-grab flex-col gap-[6px] touch-none active:cursor-grabbing"
      >
        {/* Pure clear Glisse-style Liquid Glass lens (no blue tint) */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 top-0 h-[62px] w-14 rounded-full border border-white/45 bg-gradient-to-b from-white/30 via-white/15 to-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.75),inset_0_-1px_2px_rgba(255,255,255,0.2),0_4px_16px_rgba(0,0,0,0.25)] backdrop-blur-md ${
            dragging
              ? "scale-105 transition-transform duration-75"
              : "scale-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          }`}
          style={{
            transform: `translateY(${thumbY}px) ${dragging ? "scale(1.06)" : "scale(1)"}`,
          }}
        />

        {NAV_ITEMS.map(({ href, label, icon: Icon }, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={href}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveIndex(idx);
                  router.push(href);
                }
              }}
              className={`relative z-10 flex h-[62px] w-14 flex-col items-center justify-center gap-1 rounded-full transition-colors duration-150 ${
                isActive
                  ? "text-white"
                  : "text-white/55 hover:text-white/85"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold tracking-tight">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
