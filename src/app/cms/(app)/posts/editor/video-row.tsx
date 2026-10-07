"use client";

import type { Editor } from "@tiptap/react";
import { useState } from "react";
import type { YouTubeNode } from "@/lib/posts/body";
import { parseYouTubeUrl, VIDEO_CAPTION_MAX, youtubeWatchUrl } from "@/lib/posts/youtube";

export type VideoAttrs = YouTubeNode["attrs"];

/** pos is null when inserting a new video. */
export type VideoTarget = { pos: number | null; attrs: VideoAttrs | null };

type Props = {
  editor: Editor;
  idPrefix: string;
  target: VideoTarget;
  onClose: () => void;
};

export function VideoRow({ editor, idPrefix, target, onClose }: Props) {
  const initial = target.attrs;
  const [address, setAddress] = useState(initial ? youtubeWatchUrl(initial.id, initial.start) : "");
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [error, setError] = useState("");
  const editing = target.pos !== null;
  const errorId = `${idPrefix}-video-error`;

  function currentNodeOk(): boolean {
    if (target.pos === null) return true;
    const node = editor.state.doc.nodeAt(target.pos);
    return node?.type.name === "youtube" && node.attrs.id === target.attrs?.id;
  }

  function apply() {
    const video = parseYouTubeUrl(address);
    if (!video) {
      setError("Paste a YouTube video link, like https://youtu.be/... or https://www.youtube.com/watch?v=...");
      return;
    }
    if (!currentNodeOk()) {
      setError("The video moved while this row was open. Select it again.");
      return;
    }
    const attrs: VideoAttrs = { ...video, caption: caption.replace(/\s+/g, " ").trim() };
    if (target.pos === null) {
      editor.chain().focus().insertContent({ type: "youtube", attrs }).run();
    } else {
      const pos = target.pos;
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          tr.setNodeMarkup(pos, undefined, attrs);
          return true;
        })
        .setNodeSelection(pos)
        .run();
    }
    onClose();
  }

  function remove() {
    if (target.pos === null || !currentNodeOk()) return;
    const node = editor.state.doc.nodeAt(target.pos)!;
    editor.chain().focus().deleteRange({ from: target.pos, to: target.pos + node.nodeSize }).run();
    onClose();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      apply();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div className="cms-link-row">
      <div className="cms-link-fields">
        <label htmlFor={`${idPrefix}-video`}>YouTube link</label>
        <input
          id={`${idPrefix}-video`}
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://youtu.be/..."
          value={address}
          autoFocus
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : `${idPrefix}-video-hint`}
          onChange={(event) => setAddress(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <label htmlFor={`${idPrefix}-video-caption`}>Caption</label>
        <input
          id={`${idPrefix}-video-caption`}
          autoComplete="off"
          placeholder="Optional"
          maxLength={VIDEO_CAPTION_MAX}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className="cms-link-actions">
        <button type="button" className="cms-button cms-button-quiet" onClick={apply}>
          {editing ? "Update" : "Insert"}
        </button>
        {editing ? (
          <button type="button" className="cms-button cms-button-quiet" onClick={remove}>
            Remove video
          </button>
        ) : null}
        <button type="button" className="cms-button cms-button-quiet" onClick={onClose}>
          Cancel
        </button>
      </div>
      {error ? (
        <p id={errorId} className="cms-field-error">
          {error}
        </p>
      ) : (
        <p id={`${idPrefix}-video-hint`} className="cms-link-hint">
          Watch, Share, Shorts and live links all work. A start time in the link (like t=90) is kept.
        </p>
      )}
    </div>
  );
}
