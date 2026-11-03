import { NextRequest, NextResponse } from "next/server";

type SoundKind = "place" | "capture" | "win";

const SEARCH_QUERIES: Record<SoundKind, string> = {
  place: "game stone place",
  capture: "game collect",
  win: "game win fanfare",
};

interface CacheEntry {
  url: string;
  fetchedAt: number;
}

const cache = new Map<SoundKind, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const kind = searchParams.get("kind") as SoundKind | null;

  if (!kind || !SEARCH_QUERIES[kind]) {
    return NextResponse.json(
      { error: "Invalid kind parameter" },
      { status: 400 }
    );
  }

  const apiKey = process.env.FREESOUND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "FreeSound API key not configured" },
      { status: 500 }
    );
  }

  const cached = cache.get(kind);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ url: cached.url });
  }

  const query = SEARCH_QUERIES[kind];
  const url = new URL("https://freesound.org/apiv2/search/text/");
  url.searchParams.set("query", query);
  url.searchParams.set("token", apiKey);
  url.searchParams.set("fields", "id,previews");
  url.searchParams.set("page_size", "1");
  url.searchParams.set("format", "json");

  try {
    const response = await fetch(url.toString());

    if (response.status === 401) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    if (response.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "FreeSound API error" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: "No sounds found" },
        { status: 404 }
      );
    }

    const previewUrl =
      data.results[0].previews["preview-lq-mp3"] ||
      data.results[0].previews["preview-lq-ogg"];

    if (!previewUrl) {
      return NextResponse.json(
        { error: "No preview available" },
        { status: 404 }
      );
    }

    cache.set(kind, { url: previewUrl, fetchedAt: Date.now() });

    return NextResponse.json({ url: previewUrl });
  } catch (error) {
    console.error("FreeSound API error:", error);
    return NextResponse.json(
      { error: "Network error" },
      { status: 500 }
    );
  }
}
