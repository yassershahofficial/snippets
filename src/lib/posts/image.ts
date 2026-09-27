import type { CSSProperties } from "react";
import type { ImageCrop, ImageRatio, ImageSize } from "./body";

export const IMAGE_SIZES: ImageSize[] = ["full", "medium", "small"];
export const IMAGE_RATIOS: ImageRatio[] = ["original", "16:9", "4:3", "1:1", "3:4"];

export const IMAGE_SIZE_LABELS: Record<ImageSize, string> = {
  full: "Full",
  medium: "Medium",
  small: "Small",
};

export const IMAGE_RATIO_LABELS: Record<ImageRatio, string> = {
  original: "Original",
  "16:9": "16:9",
  "4:3": "4:3",
  "1:1": "1:1",
  "3:4": "3:4",
};

export const IMAGE_TEXT_MAX = 300;
/** Smallest crop side, as a fraction of the image. */
export const MIN_CROP = 0.05;

const RATIO_VALUES: Record<Exclude<ImageRatio, "original">, number> = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
  "3:4": 3 / 4,
};

export function ratioValue(ratio: ImageRatio): number | null {
  return ratio === "original" ? null : RATIO_VALUES[ratio];
}

/** Crop height fraction that keeps the given ratio for a crop width fraction. */
export function cropHeightFor(w: number, width: number, height: number, ratio: number): number {
  return (w * width) / (height * ratio);
}

/** Largest crop of the ratio, centered. */
export function centeredCrop(width: number, height: number, ratio: number): ImageCrop {
  let w = 1;
  let h = cropHeightFor(1, width, height, ratio);
  if (h > 1) {
    h = 1;
    w = (ratio * height) / width;
  }
  return round({ x: (1 - w) / 2, y: (1 - h) / 2, w, h });
}

/** Keeps a crop inside the image, at least MIN_CROP, with the ratio intact. */
export function clampCrop(crop: ImageCrop, width: number, height: number, ratio: number): ImageCrop {
  const max = centeredCrop(width, height, ratio);
  let w = Math.min(Math.max(crop.w, MIN_CROP), max.w);
  let h = cropHeightFor(w, width, height, ratio);
  if (h < MIN_CROP) {
    h = MIN_CROP;
    w = Math.min((h * height * ratio) / width, max.w);
    h = cropHeightFor(w, width, height, ratio);
  }
  const x = Math.min(Math.max(crop.x, 0), 1 - w);
  const y = Math.min(Math.max(crop.y, 0), 1 - h);
  return round({ x, y, w, h });
}

function round(crop: ImageCrop): ImageCrop {
  const r = (n: number) => Math.round(n * 10000) / 10000;
  return { x: r(crop.x), y: r(crop.y), w: r(crop.w), h: r(crop.h) };
}

/**
 * Styles that show only the crop: a frame with the crop's shape, and the full
 * image scaled and shifted inside it.
 */
export function cropStyles(
  crop: ImageCrop,
  width: number,
  height: number,
): { frame: CSSProperties; image: CSSProperties } {
  return {
    frame: { aspectRatio: `${Math.round(crop.w * width)} / ${Math.round(crop.h * height)}` },
    image: {
      width: `${100 / crop.w}%`,
      height: `${100 / crop.h}%`,
      left: `${(-crop.x / crop.w) * 100}%`,
      top: `${(-crop.y / crop.h) * 100}%`,
    },
  };
}
