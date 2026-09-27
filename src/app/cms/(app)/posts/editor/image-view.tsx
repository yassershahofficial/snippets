"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { useContext } from "react";
import type { ImageNode } from "@/lib/posts/body";
import { PostFigure } from "@/lib/posts/figure";
import { MediaContext } from "./media-context";

export function ImageView({ node, selected }: ReactNodeViewProps) {
  const { urls, editImage } = useContext(MediaContext);
  const attrs = node.attrs as ImageNode["attrs"];
  const src = attrs.media ? urls[attrs.media] : undefined;

  return (
    <NodeViewWrapper className="cms-image-node" data-selected={selected ? "" : undefined} data-drag-handle="">
      {src ? (
        <PostFigure attrs={attrs} src={src} lazy={false} />
      ) : (
        <p className="cms-image-missing">This image is no longer available. Select it, then remove or replace it.</p>
      )}
      {selected ? (
        <button type="button" className="cms-button cms-image-edit" onClick={editImage}>
          Edit image
        </button>
      ) : null}
    </NodeViewWrapper>
  );
}
