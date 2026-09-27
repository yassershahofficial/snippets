"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Formats in the reader's own time zone; the server render shows UTC until hydration. */
export function LocalTime({ iso }: { iso: string }) {
  const label = useSyncExternalStore(
    subscribe,
    () => format(iso),
    () => `${format(iso, "UTC")} UTC`,
  );
  return <time dateTime={iso}>{label}</time>;
}

function format(iso: string, timeZone?: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}
