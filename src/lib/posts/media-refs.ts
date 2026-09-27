import type { Json } from "@/lib/supabase/database.types";

/** Media ids referenced by image nodes anywhere in a stored post body. */
export function collectMediaIds(body: Json | undefined): Set<string> {
  const ids = new Set<string>();
  const walk = (node: Json | undefined) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node.type === "image") {
      const attrs = node.attrs;
      if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) {
        const media = attrs.media;
        if (typeof media === "string") ids.add(media);
      }
    }
    walk(node.content);
  };
  walk(body);
  return ids;
}
