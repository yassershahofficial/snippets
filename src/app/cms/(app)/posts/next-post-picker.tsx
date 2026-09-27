"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { NextPostOption } from "@/lib/cms/posts";

type Props = {
  id: string;
  name: string;
  options: NextPostOption[];
  defaultValue: string;
  invalid?: boolean;
  describedBy?: string;
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function matches(title: string, query: string): boolean {
  const haystack = title.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function NextPostPicker({
  id,
  name,
  options,
  defaultValue,
  invalid,
  describedBy,
}: Props) {
  const listboxId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [selectedId, setSelectedId] = useState(defaultValue);
  const selected = options.find((o) => o.id === selectedId) ?? null;
  const [query, setQuery] = useState(selected?.title ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const results = useMemo(
    () => (open && query.trim() ? options.filter((o) => matches(o.title, query)) : options),
    [options, query, open],
  );

  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function choose(option: NextPostOption | null) {
    setSelectedId(option?.id ?? "");
    setQuery(option?.title ?? "");
    setOpen(false);
    setActive(-1);
  }

  function collapse(nextQuery: string) {
    setQuery(nextQuery);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      if (active >= 0 && results[active]) choose(results[active]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      collapse("");
    }
  }

  const placeholder = selected
    ? selected.title
    : selectedId
      ? "The linked post is no longer available"
      : `Search ${options.length} published ${options.length === 1 ? "post" : "posts"}`;

  return (
    <div className="cms-combobox">
      <input type="hidden" name={name} value={selectedId} />
      <div className="cms-combobox-control">
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && active >= 0 && results[active] ? `${listboxId}-${active}` : undefined
          }
          aria-invalid={invalid ? true : undefined}
          aria-describedby={describedBy}
          placeholder={placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          onBlur={() => collapse(selected?.title ?? "")}
          onKeyDown={onKeyDown}
        />
        {selectedId ? (
          <button
            type="button"
            className="cms-button cms-button-quiet"
            onClick={() => choose(null)}
          >
            Clear
          </button>
        ) : null}
      </div>
      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Published posts"
          className="cms-combobox-list"
          onMouseDown={(event) => event.preventDefault()}
        >
          {results.length === 0 ? (
            <li className="cms-combobox-empty">No published post matches.</li>
          ) : (
            results.map((option, index) => (
              <li
                key={option.id}
                id={`${listboxId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={option.id === selectedId}
                data-current={option.id === selectedId ? "" : undefined}
                data-active={index === active ? "" : undefined}
                onClick={() => choose(option)}
                onMouseMove={() => setActive(index)}
              >
                <span>{option.title}</span>
                <span className="cms-combobox-meta">
                  {option.status !== "published"
                    ? "Not published"
                    : option.published_at
                      ? dateFormat.format(new Date(option.published_at))
                      : null}
                </span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
