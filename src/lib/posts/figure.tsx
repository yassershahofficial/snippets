import type { ImageNode } from "./body";
import { cropStyles } from "./image";

type Attrs = ImageNode["attrs"];

/** Image with its display crop, size and caption. Shared by the site and the editor. */
export function PostFigure({ attrs, src, lazy = true }: { attrs: Attrs; src: string; lazy?: boolean }) {
  const alt = attrs.decorative ? "" : attrs.alt;
  const size = attrs.size === "medium" || attrs.size === "small" ? attrs.size : "full";
  const crop = attrs.ratio !== "original" ? attrs.crop : null;
  const styles = crop ? cropStyles(crop, attrs.width, attrs.height) : null;
  const maxWidth = Math.round((crop ? crop.w : 1) * attrs.width);

  return (
    <figure className={`post-figure post-figure-${size}`} style={{ maxWidth }}>
      {styles ? (
        <div className="post-figure-frame" style={styles.frame}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} style={styles.image} loading={lazy ? "lazy" : undefined} draggable={false} />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="post-img"
          src={src}
          alt={alt}
          width={attrs.width}
          height={attrs.height}
          loading={lazy ? "lazy" : undefined}
          draggable={false}
        />
      )}
      {attrs.caption ? <figcaption className="post-figcaption">{attrs.caption}</figcaption> : null}
    </figure>
  );
}
