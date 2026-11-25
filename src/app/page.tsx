import { Suspense } from "react";
import { HomeClient } from "@/components/HomeClient";
import { getHomeShelves } from "@/lib/ytmusic";

export const revalidate = 900;

export default async function HomePage() {
  const shelves = await getHomeShelves();
  return (
    <Suspense fallback={null}>
      <HomeClient initialShelves={shelves} />
    </Suspense>
  );
}
