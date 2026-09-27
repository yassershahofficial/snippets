"use client";

import { useId, useMemo, useState } from "react";
import { LIMITS, normalizeTag, parseTags } from "@/lib/cms/post-form";
import type { TagOption } from "@/lib/cms/posts";

type Props = {
  id: string;
  name: string;
  options: TagOption[];
  defaultValue: string;
  invalid?: boolean;
  describedBy?: string;
};

type Suggestion = { tag: string; count: number | null };

const MAX_SUGGESTIONS = 8;

function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length];
}

/** Exact match, then partial matches, then likely misspellings, then the new tag. */
function suggest(query: string, options: TagOption[], selected: string[]): Suggestion[] {
  const available = options.filter((o) => !selected.includes(o.tag));
  const q = normalizeTag(query);
  if (!q) return available.slice(0, MAX_SUGGESTIONS);

  const exact = available.find((o) => o.tag === q);
  const partial = available
    .filter((o) => o.tag !== q && o.tag.includes(q))
    .sort((a, b) => Number(b.tag.startsWith(q)) - Number(a.tag.startsWith(q)));
  const maxTypos = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
  const similar = maxTypos
    ? available.filter((o) => !o.tag.includes(q) && editDistance(o.tag, q) <= maxTypos)
    : [];

  const list: Suggestion[] = [...(exact ? [exact] : []), ...partial, ...similar].slice(
    0,
    MAX_SUGGESTIONS,
  );
  if (!exact && !selected.includes(q)) list.push({ tag: q, count: null });
  return list;
}

export function TagPicker({ id, name, options, defaultValue, invalid, describedBy }: Props) {
  const listboxId = useId();
  const [tags, setTags] = useState(() => parseTags(defaultValue));
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const full = tags.length >= LIMITS.tags;
  const suggestions = useMemo(
    () => (full ? [] : suggest(query, options, tags)),
    [full, query, options, tags],
  );
  const showList = open && suggestions.length > 0;

  function add(raw: string[]) {
    setTags((current) => {
      const next = [...current];
      for (const part of raw) {
        const tag = normalizeTag(part);
        if (tag && !next.includes(tag) && next.length < LIMITS.tags) next.push(tag);
      }
      return next;
    });
    setQuery("");
    setActive(0);
  }

  function remove(tag: string) {
    setTags((current) => current.filter((t) => t !== tag));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      if (!query.trim() && !showList) return;
      event.preventDefault();
      const pick = showList ? suggestions[active] : null;
      add([pick ? pick.tag : query]);
    } else if (event.key === ",") {
      event.preventDefault();
      if (query.trim()) add([query]);
    } else if (event.key === "Backspace" && !query && tags.length > 0) {
      remove(tags[tags.length - 1]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setQuery("");
      setOpen(false);
    }
  }

  return (
    <div className="cms-combobox">
      <input type="hidden" name={name} value={tags.join(", ")} />
      <div className="cms-tags">
        {tags.length > 0 ? (
          <ul className="cms-tag-list" aria-label="Selected tags">
            {tags.map((tag) => (
              <li key={tag} className="cms-tag">
                <span>{tag}</span>
                <button type="button" aria-label={`Remove ${tag}`} onClick={() => remove(tag)}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          disabled={full}
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${listboxId}-${active}` : undefined}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          placeholder={full ? `Limit of ${LIMITS.tags} tags reached` : "Search or add a tag"}
          value={query}
          onChange={(event) => {
            const parts = event.target.value.split(",");
            if (parts.length > 1) add(parts.slice(0, -1));
            setQuery(parts[parts.length - 1]);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => {
            if (query.trim()) add([query]);
            setOpen(false);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {showList ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Tag suggestions"
          className="cms-combobox-list"
          onMouseDown={(event) => event.preventDefault()}
        >
          {suggestions.map((option, index) => (
            <li
              key={option.tag}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === active}
              data-active={index === active ? "" : undefined}
              onClick={() => add([option.tag])}
              onMouseMove={() => setActive(index)}
            >
              <span>{option.tag}</span>
              <span className="cms-combobox-meta">
                {option.count === null
                  ? "New tag"
                  : `${option.count} ${option.count === 1 ? "post" : "posts"}`}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
