"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useContext } from "react";
import type { YouTubeNode } from "@/lib/posts/body";
import { formatStart, youtubeThumbnailUrl } from "@/lib/posts/youtube";
import { MediaContext } from "./media-context";

/** Thumbnail instead of the player, so clicks select the block rather than play the video. */
export function VideoView({ node, selected }: ReactNodeViewProps) {
  const { editVideo } = useContext(MediaContext);
  const attrs = node.attrs as YouTubeNode["attrs"];

  return (
    <NodeViewWrapper className="cms-video-node" data-selected={selected ? "" : undefined} data-drag-handle="">
      <figure className="post-video">
        <div className="post-video-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={youtubeThumbnailUrl(attrs.id)} alt="" draggable={false} />
          <span className="cms-video-badge">
            YouTube video{attrs.start > 0 ? `, starts at ${formatStart(attrs.start)}` : ""}
          </span>
        </div>
        {attrs.caption ? <figcaption className="post-figcaption">{attrs.caption}</figcaption> : null}
      </figure>
      {selected ? (
        <button type="button" className="cms-button cms-image-edit" onClick={editVideo}>
          Edit video
        </button>
      ) : null}
    </NodeViewWrapper>
  );
}
