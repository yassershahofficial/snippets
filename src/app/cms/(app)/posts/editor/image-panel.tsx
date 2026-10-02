"use client";

import type { Editor } from "@tiptap/react";
import { useRef, useState } from "react";
import { CMS_MEDIA } from "@/lib/cms/paths";
import { MEDIA_MAX_HEIGHT, MEDIA_MAX_WIDTH } from "@/lib/media/limits";
import type { ImageCrop, ImageNode, ImageRatio, ImageSize } from "@/lib/posts/body";
import {
  centeredCrop,
  IMAGE_RATIO_LABELS,
  IMAGE_RATIOS,
  IMAGE_SIZE_LABELS,
  IMAGE_SIZES,
  IMAGE_TEXT_MAX,
  ratioValue,
} from "@/lib/posts/image";
import { CropBox } from "./crop-box";

export type ImageAttrs = ImageNode["attrs"];

/** pos is null when inserting a new image. */
export type ImageTarget = { pos: number | null; attrs: ImageAttrs | null };

type Media = { id: string; width: number; height: number };

type Props = {
  editor: Editor;
  idPrefix: string;
  postId?: string;
  target: ImageTarget;
  urls: Record<string, string>;
  onUploaded: (id: string, url: string) => void;
  onClose: () => void;
};

const SIZE_HINTS: Record<ImageSize, string> = {
  full: "Column width",
  medium: "Three quarters",
  small: "Half width",
};

async function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, 0.85));
}

/** Shrinks in the browser first so big phone photos upload fast; the server re-encodes anyway. */
async function shrinkImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This file couldn't be read. Use a JPEG, PNG or WebP image.");
  }
  const scale = Math.min(1, MEDIA_MAX_WIDTH / bitmap.width, MEDIA_MAX_HEIGHT / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const webp = await encode(canvas, "image/webp");
  if (webp?.type === "image/webp") return webp;
  const jpeg = await encode(canvas, "image/jpeg");
  if (!jpeg) throw new Error("This image couldn't be prepared for upload. Try another file.");
  return jpeg;
}

export function ImagePanel({ editor, idPrefix, postId, target, urls, onUploaded, onClose }: Props) {
  const initial = target.attrs;
  const [media, setMedia] = useState<Media | null>(
    initial ? { id: initial.media, width: initial.width, height: initial.height } : null,
  );
  const [size, setSize] = useState<ImageSize>(initial?.size ?? "full");
  const [ratio, setRatio] = useState<ImageRatio>(initial?.ratio ?? "original");
  const [crop, setCrop] = useState<ImageCrop | null>(initial?.crop ?? null);
  const [alt, setAlt] = useState(initial?.alt ?? "");
  const [decorative, setDecorative] = useState(initial?.decorative ?? false);
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLInputElement>(null);

  const editing = target.pos !== null;
  const src = media ? urls[media.id] : undefined;
  const ratioNumber = ratioValue(ratio);

  function pickRatio(next: ImageRatio) {
    setRatio(next);
    const value = ratioValue(next);
    setCrop(media && value ? centeredCrop(media.width, media.height, value) : null);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      const blob = await shrinkImage(file);
      const form = new FormData();
      form.append("file", blob, blob.type === "image/webp" ? "image.webp" : "image.jpg");
      if (postId) form.append("postId", postId);
      const response = await fetch(CMS_MEDIA, { method: "POST", body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.id) {
        throw new Error(data?.error ?? "The upload failed. Check your connection and try again.");
      }
      onUploaded(data.id, data.url);
      setMedia({ id: data.id, width: data.width, height: data.height });
      const value = ratioValue(ratio);
      setCrop(value ? centeredCrop(data.width, data.height, value) : null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The upload failed. Try again.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function currentNodeOk(): boolean {
    if (target.pos === null) return true;
    const node = editor.state.doc.nodeAt(target.pos);
    return node?.type.name === "image" && node.attrs.media === target.attrs?.media;
  }

  function apply() {
    if (!media) {
      setError("Choose an image first.");
      return;
    }
    if (!decorative && !alt.trim()) {
      setError("Describe the image in the alt text, or mark it as decorative.");
      altRef.current?.focus();
      return;
    }
    if (!currentNodeOk()) {
      setError("The image moved while this panel was open. Select it again.");
      return;
    }
    const attrs: ImageAttrs = {
      media: media.id,
      width: media.width,
      height: media.height,
      size,
      ratio,
      crop: ratioNumber ? crop ?? centeredCrop(media.width, media.height, ratioNumber) : null,
      alt: decorative ? "" : alt.trim(),
      decorative,
      caption: caption.trim(),
    };
    if (target.pos === null) {
      editor.chain().focus().insertContent({ type: "image", attrs }).run();
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

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      if (event.target.type === "text") apply();
    }
  }

  const heading = `${idPrefix}-image-heading`;

  return (
    <section className="cms-image-panel" aria-labelledby={heading} onKeyDown={onKeyDown}>
      <h2 id={heading} className="cms-image-panel-title">
        {editing ? "Edit image" : "Add image"}
      </h2>

      <div className="cms-image-panel-grid">
        <div className="cms-image-stage">
          {media && src ? (
            ratioNumber && crop ? (
              <CropBox
                src={src}
                width={media.width}
                height={media.height}
                ratio={ratioNumber}
                crop={crop}
                onChange={setCrop}
                label={`Crop area, ${IMAGE_RATIO_LABELS[ratio]}`}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="cms-image-whole" src={src} alt="" width={media.width} height={media.height} />
            )
          ) : (
            <button
              type="button"
              className="cms-image-drop"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? "Uploading..." : "Choose an image"}
              <span>JPEG, PNG or WebP. Large photos are shrunk to 1280 by 1600.</span>
            </button>
          )}
          {media ? (
            <div className="cms-image-stage-actions">
              <button
                type="button"
                className="cms-button cms-button-quiet"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                {busy ? "Uploading..." : "Replace image"}
              </button>
              {ratioNumber ? (
                <button
                  type="button"
                  className="cms-button cms-button-quiet"
                  onClick={() => setCrop(centeredCrop(media.width, media.height, ratioNumber))}
                >
                  Reset crop
                </button>
              ) : null}
            </div>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            hidden
            onChange={(event) => onFile(event.target.files?.[0])}
          />
        </div>

        <div className="cms-image-controls">
          <fieldset className="cms-segmented">
            <legend>Shape</legend>
            <div>
              {IMAGE_RATIOS.map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name={`${idPrefix}-ratio`}
                    value={value}
                    checked={ratio === value}
                    onChange={() => pickRatio(value)}
                  />
                  <span>{IMAGE_RATIO_LABELS[value]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="cms-segmented">
            <legend>Size</legend>
            <div>
              {IMAGE_SIZES.map((value) => (
                <label key={value} title={SIZE_HINTS[value]}>
                  <input
                    type="radio"
                    name={`${idPrefix}-size`}
                    value={value}
                    checked={size === value}
                    onChange={() => setSize(value)}
                  />
                  <span>{IMAGE_SIZE_LABELS[value]}</span>
                </label>
              ))}
            </div>
            <p className="cms-image-hint">{SIZE_HINTS[size]}. Always full width on phones.</p>
          </fieldset>

          <div className="cms-image-field">
            <label htmlFor={`${idPrefix}-alt`}>Alt text</label>
            <input
              ref={altRef}
              id={`${idPrefix}-alt`}
              value={decorative ? "" : alt}
              maxLength={IMAGE_TEXT_MAX}
              disabled={decorative}
              placeholder={decorative ? "Not needed for decorative images" : "What the image shows"}
              onChange={(event) => setAlt(event.target.value)}
            />
            <label className="cms-image-check">
              <input
                type="checkbox"
                checked={decorative}
                onChange={(event) => setDecorative(event.target.checked)}
              />
              Decorative, screen readers skip it
            </label>
          </div>

          <div className="cms-image-field">
            <label htmlFor={`${idPrefix}-caption`}>
              Caption <span className="cms-image-optional">(optional)</span>
            </label>
            <input
              id={`${idPrefix}-caption`}
              value={caption}
              maxLength={IMAGE_TEXT_MAX}
              onChange={(event) => setCaption(event.target.value)}
            />
          </div>

          {error ? (
            <p className="cms-field-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="cms-image-actions">
            <button type="button" className="cms-button" disabled={busy || !media} onClick={apply}>
              {editing ? "Update" : "Insert"}
            </button>
            {editing ? (
              <button type="button" className="cms-button cms-button-quiet" onClick={remove}>
                Remove
              </button>
            ) : null}
            <button type="button" className="cms-button cms-button-quiet" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
