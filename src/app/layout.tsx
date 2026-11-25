import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { HomeLyricsPanel, HomeQueuePanel } from "@/components/HomeSidePanels";
import { MiniPlayer } from "@/components/MiniPlayer";
import { Navbar } from "@/components/Navbar";
import { PlayerProvider } from "@/components/PlayerContext";
import { VinylPlayer } from "@/components/VinylPlayer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PotatoMusic",
  description: "Liquid Glass vinyl music player",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.className} min-h-dvh text-[#f4f7fb] antialiased`}
      >
        <PlayerProvider>
          <div className="flex min-h-dvh flex-col">
            <Navbar />
            <HomeQueuePanel />
            <HomeLyricsPanel />
            <main className="flex-1 pb-36 pt-20 lg:pb-28">{children}</main>
            <MiniPlayer />
          </div>
          <VinylPlayer />
        </PlayerProvider>
      </body>
    </html>
  );
}
