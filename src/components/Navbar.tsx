"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { TabBar } from "glisse";
import { Suspense, useEffect, useState } from "react";

const NAV_TABS = [
  { value: "/", label: "Home" },
  { value: "/explore", label: "Explore" },
  { value: "/library", label: "Library" },
];

function getTabValue(pathname: string): string {
  if (pathname.startsWith("/explore")) return "/explore";
  if (pathname.startsWith("/library")) return "/library";
  return "/";
}

function NavbarInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(urlQ);
  const [activeTab, setActiveTab] = useState(() => getTabValue(pathname));
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setQuery(urlQ);
  }, [urlQ]);

  useEffect(() => {
    setActiveTab(getTabValue(pathname));
  }, [pathname]);

  useEffect(() => {
    NAV_TABS.forEach((t) => router.prefetch(t.value));
  }, [router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleSearchChange(val: string) {
    setQuery(val);
    const trimmed = val.trim();
    if (trimmed) {
      router.replace(`/?q=${encodeURIComponent(trimmed)}`);
    } else if (pathname === "/") {
      router.replace("/");
    }
  }

  function handleTabChange(nextVal: string) {
    setActiveTab(nextVal);
    router.push(nextVal);
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-3 sm:px-8">
      <div
        className={`pointer-events-auto flex w-full items-center justify-between gap-3 transition-all duration-300 ease-out ${
          scrolled
            ? "max-w-4xl rounded-full border border-white/15 bg-[#0e0e11]/82 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_36px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            : "max-w-7xl rounded-full border border-transparent bg-transparent px-1 py-2.5 shadow-none"
        }`}
      >
        {/* Left: Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <img
            src="/potato-mascot.svg"
            alt="PotatoMusic"
            className="h-8 w-8 rounded-full"
          />
          <span className="hidden text-base font-bold tracking-tight text-white md:inline">
            Potato<span className="text-[#38bdf8]">Music</span>
          </span>
        </Link>

        {/* Center: Real glisse Liquid Glass TabBar */}
        <div className="hidden lg:block">
          <TabBar
            items={NAV_TABS}
            value={activeTab}
            onValueChange={handleTabChange}
            aria-label="Primary navigation"
          />
        </div>

        {/* Right: Sleek Search pill */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm lg:flex-none lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa6bc]" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                handleSearchChange("");
                e.currentTarget.blur();
              }
            }}
            placeholder="Search songs, artists..."
            className="h-9 w-full rounded-full border border-white/12 bg-white/[0.06] pl-10 pr-8 text-sm text-white placeholder-[#9aa6bc] transition-colors focus:border-[#38bdf8]/60 focus:bg-white/[0.1] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[#9aa6bc] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<div className="h-16" />}>
      <NavbarInner />
    </Suspense>
  );
}
