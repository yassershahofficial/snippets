"use client";

import { createContext } from "react";

export type MediaContextValue = {
  /** Signed URLs for private images, by media id. */
  urls: Record<string, string>;
  /** Opens the image panel for the selected image. */
  editImage: () => void;
  /** Opens the video row for the selected video. */
  editVideo: () => void;
};

export const MediaContext = createContext<MediaContextValue>({
  urls: {},
  editImage: () => {},
  editVideo: () => {},
});
