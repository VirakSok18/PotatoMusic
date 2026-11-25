import { NextResponse } from "next/server";
import { getHomeShelves } from "@/lib/ytmusic";

export async function GET() {
  try {
    const shelves = await getHomeShelves();
    return NextResponse.json({ shelves });
  } catch (err) {
    console.error("[/api/home]", err);
    return NextResponse.json(
      { shelves: [], error: "Failed to load music shelves" },
      { status: 500 }
    );
  }
}
