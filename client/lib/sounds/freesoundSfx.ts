type SoundKind = "place" | "capture" | "win";

interface SoundCache {
  url: string;
  audio: HTMLAudioElement | null;
}

const soundCache = new Map<SoundKind, SoundCache>();
const prefetchPromises = new Map<SoundKind, Promise<void>>();

export async function prefetch(kind: SoundKind): Promise<void> {
  if (soundCache.has(kind)) {
    return;
  }

  if (prefetchPromises.has(kind)) {
    return prefetchPromises.get(kind);
  }

  const promise = (async () => {
    try {
      const response = await fetch(`/api/freesound/preview?kind=${kind}`);

      if (!response.ok) {
        console.warn(`Failed to fetch sound ${kind}:`, response.status);
        return;
      }

      const data = await response.json();

      if (!data.url) {
        console.warn(`No URL returned for sound ${kind}`);
        return;
      }

      soundCache.set(kind, { url: data.url, audio: null });
    } catch (error) {
      console.warn(`Error prefetching sound ${kind}:`, error);
    }
  })();

  prefetchPromises.set(kind, promise);
  await promise;
  prefetchPromises.delete(kind);
}

export async function play(kind: SoundKind, enabled: boolean): Promise<void> {
  if (!enabled) {
    return;
  }

  await prefetch(kind);

  const cached = soundCache.get(kind);
  if (!cached) {
    return;
  }

  try {
    if (cached.audio) {
      cached.audio.currentTime = 0;
      await cached.audio.play();
    } else {
      const audio = new Audio(cached.url);
      audio.volume = 0.5;
      cached.audio = audio;
      await audio.play();
    }
  } catch (error) {
    console.warn(`Error playing sound ${kind}:`, error);
  }
}

export function preloadAll(): void {
  const kinds: SoundKind[] = ["place", "capture", "win"];
  kinds.forEach((kind) => prefetch(kind));
}
