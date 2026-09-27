"use client";

import Link from "next/link";
import { useId, useState } from "react";

export type ArchiveEntry = {
  id: string;
  href: string;
  title: string;
  description: string;
  date: string;
  year: number | null;
};

type YearGroup = { year: number | null; entries: ArchiveEntry[] };

function groupByYear(entries: ArchiveEntry[]): YearGroup[] {
  const groups: YearGroup[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.year === entry.year) last.entries.push(entry);
    else groups.push({ year: entry.year, entries: [entry] });
  }
  return groups;
}

export function ArchiveFilter({ entries }: { entries: ArchiveEntry[] }) {
  const inputId = useId();
  const [query, setQuery] = useState("");

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches =
    words.length === 0
      ? entries
      : entries.filter((entry) => {
          const text = `${entry.title} ${entry.description}`.toLowerCase();
          return words.every((word) => text.includes(word));
        });
  const groups = groupByYear(matches);

  const count =
    words.length === 0
      ? `${entries.length} ${entries.length === 1 ? "post" : "posts"}`
      : `${matches.length} of ${entries.length} ${entries.length === 1 ? "post" : "posts"}`;

  return (
    <>
      <div className="archive-search">
        <label htmlFor={inputId} className="archive-search-label">
          Filter posts
        </label>
        <input
          id={inputId}
          type="search"
          value={query}
          placeholder="Type a word from a title or description"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="archive-count" role="status" aria-live="polite">
          {count}
        </p>
      </div>

      {groups.length > 0 ? (
        groups.map((group) => (
          <section key={group.year ?? "undated"} className="archive-year" aria-labelledby={`year-${group.year ?? "undated"}`}>
            <h2 id={`year-${group.year ?? "undated"}`} className="archive-year-title">
              {group.year ?? "Undated"}
            </h2>
            <ul className="archive-list">
              {group.entries.map((entry) => (
                <li key={entry.id}>
                  <Link href={entry.href} className="archive-item">
                    <span className="archive-item-title">{entry.title}</span>
                    {entry.date ? <span className="archive-item-date">{entry.date}</span> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p className="archive-empty">
          No posts match &ldquo;{query.trim()}&rdquo;.{" "}
          <button type="button" className="archive-clear" onClick={() => setQuery("")}>
            Clear filter
          </button>
        </p>
      )}
    </>
  );
}
