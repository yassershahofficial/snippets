export const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
export const VIDEO_CAPTION_MAX = 300;
/** 99:59:59, longer than any normal upload or stream. */
export const VIDEO_START_MAX = 359_999;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const PATH_ID_PREFIXES = new Set(["embed", "shorts", "live", "v"]);

/** Seconds from a YouTube t= / start= value: "90", "90s", "1m30s", "1h2m3s". */
function parseStart(value: string | null | undefined): number {
  if (!value) return 0;
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
  if (!match) return 0;
  const [, h = "0", m = "0", s = "0"] = match;
  const seconds = Number(h) * 3600 + Number(m) * 60 + Number(s);
  return Number.isFinite(seconds) ? Math.min(seconds, VIDEO_START_MAX) : 0;
}

/**
 * Video id and start time from a YouTube link: watch, youtu.be, Shorts, live
 * and embed links. Anything else (playlists alone, channels, other sites) is null.
 */
export function parseYouTubeUrl(input: string): { id: string; start: number } | null {
  let value = input.trim();
  if (!value) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;
  if (host === "youtu.be") id = parts[0] ?? null;
  else if (YOUTUBE_HOSTS.has(host)) {
    if (parts[0] === "watch") id = url.searchParams.get("v");
    else if (PATH_ID_PREFIXES.has(parts[0] ?? "")) id = parts[1] ?? null;
  }
  if (!id || !YOUTUBE_ID.test(id)) return null;

  const hashStart = new URLSearchParams(url.hash.slice(1)).get("t");
  const start = parseStart(url.searchParams.get("t") ?? url.searchParams.get("start") ?? hashStart);
  return { id, start };
}

export function youtubeWatchUrl(id: string, start: number): string {
  return `https://www.youtube.com/watch?v=${id}${start > 0 ? `&t=${start}s` : ""}`;
}

/** Privacy-enhanced player: no YouTube cookies until the reader presses play. */
export function youtubeEmbedUrl(id: string, start: number): string {
  const params = new URLSearchParams({ rel: "0" });
  if (start > 0) params.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

export function youtubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** 90 becomes "1:30", 3723 becomes "1:02:03". */
export function formatStart(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
