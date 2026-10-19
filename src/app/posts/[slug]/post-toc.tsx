"use client";

import { useEffect, useRef } from "react";
import type { TocEntry } from "@/lib/posts/toc";

const WIDE_TOC = "(min-width: 75rem)";

type Props = {
  entries: TocEntry[];
};

/** Sticky rail on wide screens; collapsible Contents in the article column on smaller ones. */
export function PostToc({ entries }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const node = detailsRef.current;
    if (!node) return;

    const media = window.matchMedia(WIDE_TOC);
    const sync = () => {
      node.open = media.matches;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <nav className="post-toc" aria-label="Contents">
      <div className="post-toc-sticky">
        <details
          ref={detailsRef}
          className="post-toc-details"
          onToggle={(event) => {
            if (window.matchMedia(WIDE_TOC).matches) {
              event.currentTarget.open = true;
            }
          }}
        >
          <summary className="post-toc-label">Contents</summary>
          <ol className="post-toc-list">
            {entries.map((entry) => (
              <li key={entry.id} className={`post-toc-item post-toc-level-${entry.level}`}>
                <a href={`#${entry.id}`}>{entry.text}</a>
              </li>
            ))}
          </ol>
        </details>
      </div>
    </nav>
  );
}
