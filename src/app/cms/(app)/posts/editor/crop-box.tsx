"use client";

import { useId, useRef } from "react";
import type { ImageCrop } from "@/lib/posts/body";
import { clampCrop, cropHeightFor, MIN_CROP } from "@/lib/posts/image";

type Corner = "nw" | "ne" | "sw" | "se";

const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

type Drag =
  | { kind: "move"; startX: number; startY: number; crop: ImageCrop }
  | { kind: "resize"; corner: Corner; anchorX: number; anchorY: number };

type Props = {
  src: string;
  width: number;
  height: number;
  ratio: number;
  crop: ImageCrop;
  onChange: (crop: ImageCrop) => void;
  label: string;
};

/** Shows the whole image with a movable crop box that keeps the chosen shape. */
export function CropBox({ src, width, height, ratio, crop, onChange, label }: Props) {
  const hintId = useId();
  const areaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  function pointerFraction(event: React.PointerEvent) {
    const rect = areaRef.current!.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  function startMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    const point = pointerFraction(event);
    dragRef.current = { kind: "move", startX: point.x, startY: point.y, crop };
  }

  function startResize(event: React.PointerEvent<HTMLSpanElement>, corner: Corner) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      kind: "resize",
      corner,
      anchorX: corner.endsWith("w") ? crop.x + crop.w : crop.x,
      anchorY: corner.startsWith("n") ? crop.y + crop.h : crop.y,
    };
  }

  function onPointerMove(event: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const point = pointerFraction(event);
    if (drag.kind === "move") {
      onChange(
        clampCrop(
          { ...drag.crop, x: drag.crop.x + point.x - drag.startX, y: drag.crop.y + point.y - drag.startY },
          width,
          height,
          ratio,
        ),
      );
      return;
    }
    const west = drag.corner.endsWith("w");
    const north = drag.corner.startsWith("n");
    const room = west ? drag.anchorX : 1 - drag.anchorX;
    const roomY = north ? drag.anchorY : 1 - drag.anchorY;
    const fromX = Math.abs(point.x - drag.anchorX);
    const fromY = (Math.abs(point.y - drag.anchorY) * height * ratio) / width;
    const maxW = Math.min(room, (roomY * height * ratio) / width);
    const minW = Math.max(MIN_CROP, (MIN_CROP * height * ratio) / width);
    const w = Math.min(Math.max(Math.max(fromX, fromY), minW), maxW);
    const h = cropHeightFor(w, width, height, ratio);
    onChange(
      clampCrop(
        { x: west ? drag.anchorX - w : drag.anchorX, y: north ? drag.anchorY - h : drag.anchorY, w, h },
        width,
        height,
        ratio,
      ),
    );
  }

  function endDrag() {
    dragRef.current = null;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 0.05 : 0.01;
    let next: ImageCrop | null = null;
    if (event.key === "ArrowLeft") next = { ...crop, x: crop.x - step };
    else if (event.key === "ArrowRight") next = { ...crop, x: crop.x + step };
    else if (event.key === "ArrowUp") next = { ...crop, y: crop.y - step };
    else if (event.key === "ArrowDown") next = { ...crop, y: crop.y + step };
    else if (event.key === "+" || event.key === "=" || event.key === "-") {
      const w = crop.w * (event.key === "-" ? 0.95 : 1.05);
      const h = cropHeightFor(w, width, height, ratio);
      next = { x: crop.x + (crop.w - w) / 2, y: crop.y + (crop.h - h) / 2, w, h };
    }
    if (!next) return;
    event.preventDefault();
    onChange(clampCrop(next, width, height, ratio));
  }

  return (
    <div className="cms-crop" onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <div className="cms-crop-area" ref={areaRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={width} height={height} draggable={false} />
        <div
          className="cms-crop-box"
          role="group"
          tabIndex={0}
          aria-label={label}
          aria-describedby={hintId}
          style={{
            left: `${crop.x * 100}%`,
            top: `${crop.y * 100}%`,
            width: `${crop.w * 100}%`,
            height: `${crop.h * 100}%`,
          }}
          onPointerDown={startMove}
          onKeyDown={onKeyDown}
        >
          {CORNERS.map((corner) => (
            <span
              key={corner}
              className={`cms-crop-handle cms-crop-handle-${corner}`}
              aria-hidden="true"
              onPointerDown={(event) => startResize(event, corner)}
            />
          ))}
        </div>
      </div>
      <p id={hintId} className="cms-crop-hint">
        Drag to move, drag a corner to resize. Arrow keys move, + and - resize.
      </p>
    </div>
  );
}
