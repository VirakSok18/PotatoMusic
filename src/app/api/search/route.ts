import { NextRequest, NextResponse } from "next/server";
import { searchAll } from "@/lib/ytmusic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (!q) {
    return NextResponse.json({ tracks: [], artists: [], albums: [] });
  }

  try {
    const data = await searchAll(q);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/search]", err);
    return NextResponse.json(
      { tracks: [], artists: [], albums: [], error: "Search failed" },
      { status: 500 }
    );
  }
}
