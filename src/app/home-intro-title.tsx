"use client";

import { useEffect, useState } from "react";

const WORDS = ["work", "focus", "code", "life"] as const;
const LONGEST_WORD = "focus";

const TYPE_MS = 180;
const DELETE_MS = 120;
const HOLD_MS = 2800;
const GAP_MS = 700;

export function HomeIntroTitle() {
  const [text, setText] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    let wordIndex = 0;
    let charCount = 0;
    let phase: "typing" | "deleting" | "gap" = "typing";

    const schedule = (ms: number, fn: () => void) => {
      timer = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const tick = () => {
      const word = WORDS[wordIndex];

      if (phase === "typing") {
        if (charCount < word.length) {
          charCount += 1;
          setText(word.slice(0, charCount));
          schedule(TYPE_MS, tick);
          return;
        }

        phase = "deleting";
        schedule(HOLD_MS, tick);
        return;
      }

      if (phase === "deleting") {
        if (charCount > 0) {
          charCount -= 1;
          setText(word.slice(0, charCount));
          schedule(DELETE_MS, tick);
          return;
        }

        phase = "gap";
        schedule(GAP_MS, tick);
        return;
      }

      wordIndex = (wordIndex + 1) % WORDS.length;
      phase = "typing";
      charCount = 0;
      schedule(TYPE_MS, tick);
    };

    schedule(TYPE_MS, tick);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <h1
      className="home-intro-title"
      aria-label="Thoughts on work, focus, code, and life that matters."
    >
      <span aria-hidden="true" className="home-intro-title-lines">
        <span className="home-intro-title-lead">
          Thoughts on{" "}
          <span className="home-intro-typed">
            <span className="home-intro-typed-sizer">{LONGEST_WORD}</span>
            <span className="home-intro-typed-live">
              <span className="home-intro-typed-text">{text}</span>
              <span className="home-intro-typed-cursor" />
            </span>
          </span>
        </span>
        <span className="home-intro-title-tail">that matters.</span>
      </span>
    </h1>
  );
}
